import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);
  constructor(private prisma: PrismaService) {}

  async handleWebhook(payload: any) {
    try {
      const event = payload?.event ?? payload;
      this.logger.debug(`Incoming payload: ${JSON.stringify(payload)}`);
      if (!event || !event.id || !event.type) {
        this.logger.warn('Invalid event payload');
        return { ok: true };
      }

      const eventId = event.id;
      const type = event.type;
      this.logger.log(`RevenueCat event received id=${eventId} type=${type}`);

      // Idempotency check
      const existing = await this.prisma.processedWebhook.findUnique({
        where: { id: eventId },
      });
      if (existing) {
        this.logger.log(
          `Event already processed; skipping duplicate eventId=${eventId}`,
        );
        return { ok: true };
      }

      // Helper to safely parse timestamps
      const parseDate = (obj: any, keys: string[]) => {
        for (const k of keys) {
          const v = obj[k];
          if (v === undefined || v === null) continue;
          if (typeof v === 'number') return new Date(v);
          if (typeof v === 'string') {
            if (/^\d+$/.test(v)) return new Date(Number(v));
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
          }
        }
        return null;
      };

      // Events grouping
      const purchaseEvents = new Set([
        'INITIAL_PURCHASE',
        'RENEWAL',
        'NON_RENEWING_PURCHASE',
        'PURCHASE',
        'PURCHASE_RESTORED',
        'ENTITLEMENT_PURCHASED',
      ]);
      const cancelEvents = new Set(['CANCELLATION', 'ENTITLEMENT_REVOKED']);
      const expirationEvents = new Set(['EXPIRATION']);

      // Generic event fields
      const productId = event.product_id ?? event.productId ?? '';
      const mapping: Record<string, number> = {
        plan_499_usd_50_uses: 50,
        plan_999_usd_120_uses: 120,
      };
      const credits = mapping[productId];
      const userId = event.app_user_id ?? event.appUserId;
      const transactionIdentifier =
        event.transaction_id ?? event.transactionId ?? null;
      const startDate =
        parseDate(event, [
          // RevenueCat variants seen in different webhook payloads
          'purchased_at_ms',
          'purchased_at',
          'purchasedAt',
          'purchase_date_ms',
          'purchase_date',
          'purchaseDate',
          // fallback to event timestamp if purchase time is not present
          'event_timestamp_ms',
          'event_timestamp',
          'eventTimestamp',
        ]) ?? new Date();

      const endDate =
        parseDate(event, [
          // RevenueCat expiration variants
          'expiration_at_ms',
          'expiration_at',
          'expirationAt',
          'expires_date_ms',
          'expires_date',
          'expiresDate',
        ]) ?? new Date();

      // Purchase / Renewal flows
      if (purchaseEvents.has(type)) {
        this.logger.log(
          `[RevenueCat] Handling purchase/renewal event type=${type} product=${productId}`,
        );

        if (!credits) {
          this.logger.warn(
            'Unknown product_id; recording webhook only',
            { eventId, type, productId },
          );
          await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
          return { ok: true };
        }

        try {
          await this.prisma.$transaction(async (tx) => {
            await tx.processedWebhook.create({ data: { id: eventId, type } });

            if (!userId) {
              this.logger.log(
                `No userId in event; processedWebhook recorded eventId=${eventId}`,
              );
              return;
            }

            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) {
              this.logger.warn(
                `User not found for app_user_id=${userId}; skipping DB user/subscription update`,
              );
              return;
            }

            await tx.user.update({
              where: { id: userId },
              data: { subscribed: true },
            });

            await tx.subscription.create({
              data: {
                userId,
                totalCredits: credits,
                usedCredits: 0,
                startDate,
                endDate,
                transactionIdentifier,
              },
            });
          });
          this.logger.log(`Purchase/renewal handled eventId=${eventId}`);
        } catch (err) {
          this.logger.error(`Error processing purchase event ${eventId}`, err as any);
        }

        return { ok: true };
      }

      // Cancellation / Entitlement revoked flows
      if (cancelEvents.has(type) || expirationEvents.has(type)) {
        this.logger.log(`[RevenueCat] Handling cancel/expire event type=${type}`);
        const now = new Date();
        try {
          await this.prisma.$transaction(async (tx) => {
            await tx.processedWebhook.create({ data: { id: eventId, type } });

            if (!userId) {
              this.logger.log(
                `No userId present in event; recorded processedWebhook eventId=${eventId}`,
              );
              return;
            }

            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) {
              this.logger.warn(
                `User not found for app_user_id=${userId}; skipping cancel/expire updates`,
              );
              return;
            }

            await tx.user.update({ where: { id: userId }, data: { subscribed: false } });

            // Delete expired/targeted subscriptions for this user.
            // Prefer deleting by transaction identifier when available,
            // otherwise delete subscriptions that have already expired.
            let deletedResult: any;
            if (transactionIdentifier) {
              deletedResult = await tx.subscription.deleteMany({
                where: { userId, transactionIdentifier },
              });
            } else {
              deletedResult = await tx.subscription.deleteMany({
                where: { userId, endDate: { lte: now } },
              });
            }
            this.logger.log(
              `[RevenueCat] Deleted ${deletedResult?.count ?? 0} expired/targeted subscriptions for userId=${userId}`,
            );
          });
          this.logger.log(`Cancel/expire handled eventId=${eventId}`);
        } catch (err) {
          this.logger.error(`Error processing cancel/expire event ${eventId}`, err as any);
        }

        return { ok: true };
      }

      // Default: record the webhook for idempotency and investigate later
      this.logger.log(
        `[RevenueCat] Unhandled event type=${type}; recording processedWebhook eventId=${eventId}`,
      );
      await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
      return { ok: true };
    } catch (err) {
      this.logger.error('Unexpected error in handleWebhook', err as any);
      // Always ack to prevent webhook retries; ops can investigate logs
      return { ok: true };
    }
  }
}

