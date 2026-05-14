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
      // Console dump for debugging: show full incoming payload and resolved event
      try {
        console.log('[RevenueCat] Raw payload:', JSON.stringify(payload, null, 2));
        console.log('[RevenueCat] Resolved event:', JSON.stringify(event, null, 2));
      } catch (err) {
        // fallback in case of circular structures
        console.log('[RevenueCat] Raw payload (stringify failed), using direct log:');
        console.log(payload);
        console.log('[RevenueCat] Resolved event:');
        console.log(event);
      }
      if (!event || !event.id || !event.type) {
        this.logger.warn('Invalid event payload');
        try {
          console.log('[RevenueCat] Invalid event payload received:', JSON.stringify(payload, null, 2));
        } catch (e) {
          console.log('[RevenueCat] Invalid event payload received (raw):', payload);
        }
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
        try {
          console.log('[RevenueCat] Duplicate processedWebhook record:', JSON.stringify(existing, null, 2));
        } catch (e) {
          console.log('[RevenueCat] Duplicate processedWebhook record (raw):', existing);
        }
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

      let endDate =
        parseDate(event, [
          // RevenueCat expiration variants
          'expiration_at_ms',
          'expiration_at',
          'expirationAt',
          'expires_date_ms',
          'expires_date',
          'expiresDate',
        ]) ?? new Date();

      // If the purchase start date is today, set endDate to one month after startDate
      const isSameUTCDate = (a: Date, b: Date) =>
        a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate();

      try {
        const now = new Date();
        if (startDate && isSameUTCDate(startDate, now)) {
          const nextMonth = new Date(startDate.getTime());
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          endDate = nextMonth;
        }
      } catch (err) {
        // If adjustment fails, keep parsed endDate and continue
        this.logger.debug('Failed to adjust endDate to one month after startDate', err as any);
      }

      // Console log parsed summary values for quick inspection in terminal
      try {
        console.log('[RevenueCat] Parsed fields:', {
          id: eventId,
          type,
          productId,
          app_user_id: userId,
          transactionIdentifier,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          event_timestamp_ms: event.event_timestamp_ms ?? event.event_timestamp ?? event.eventTimestamp ?? null,
        });
      } catch (err) {
        console.log('[RevenueCat] Parsed fields (fallback): id=', eventId, 'type=', type);
      }

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
          try {
            console.log('[RevenueCat] Unknown product_id; productId=', productId, 'eventId=', eventId);
          } catch (e) {
            console.log('[RevenueCat] Unknown product_id branch hit');
          }
          await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
          return { ok: true };
        }

        try {
          await this.prisma.$transaction(async (tx) => {
            const processed = await tx.processedWebhook.create({ data: { id: eventId, type } });
            try {
              console.log('[RevenueCat] processedWebhook created (purchase):', JSON.stringify(processed, null, 2));
            } catch (e) {
              console.log('[RevenueCat] processedWebhook created (purchase):', processed);
            }

            if (!userId) {
              this.logger.log(
                `No userId in event; processedWebhook recorded eventId=${eventId}`,
              );
              try {
                console.log('[RevenueCat] Event missing app_user_id, event:', JSON.stringify(event, null, 2));
              } catch (e) {
                console.log('[RevenueCat] Event missing app_user_id (raw):', event);
              }
              return;
            }

            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) {
              this.logger.warn(
                `User not found for app_user_id=${userId}; skipping DB user/subscription update`,
              );
              console.log('[RevenueCat] Could not find user for id:', userId);
              return;
            }

            const updatedUser = await tx.user.update({
              where: { id: userId },
              data: { subscribed: true },
            });
            console.log('[RevenueCat] User updated subscribed=true:', updatedUser);

            const createdSub = await tx.subscription.create({
              data: {
                userId,
                totalCredits: credits,
                usedCredits: 0,
                startDate,
                endDate,
                transactionIdentifier,
              },
            });
            try {
              console.log('[RevenueCat] Subscription created:', JSON.stringify(createdSub, null, 2));
            } catch (e) {
              console.log('[RevenueCat] Subscription created (raw):', createdSub);
            }
          });
          this.logger.log(`Purchase/renewal handled eventId=${eventId}`);
          console.log('[RevenueCat] Purchase/renewal flow completed for eventId=', eventId);
        } catch (err) {
          this.logger.error(`Error processing purchase event ${eventId}`, err as any);
          console.log('[RevenueCat] Error processing purchase event', eventId, err);
        }

        return { ok: true };
      }

      // Cancellation / Entitlement revoked flows
      if (cancelEvents.has(type) || expirationEvents.has(type)) {
        this.logger.log(`[RevenueCat] Handling cancel/expire event type=${type}`);
        const now = new Date();
        try {
          await this.prisma.$transaction(async (tx) => {
            const processed = await tx.processedWebhook.create({ data: { id: eventId, type } });
            try {
              console.log('[RevenueCat] processedWebhook created (cancel/expire):', JSON.stringify(processed, null, 2));
            } catch (e) {
              console.log('[RevenueCat] processedWebhook created (cancel/expire):', processed);
            }

            if (!userId) {
              this.logger.log(
                `No userId present in event; recorded processedWebhook eventId=${eventId}`,
              );
              try {
                console.log('[RevenueCat] No userId present in event:', JSON.stringify(event, null, 2));
              } catch (e) {
                console.log('[RevenueCat] No userId present in event (raw):', event);
              }
              return;
            }

            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) {
              this.logger.warn(
                `User not found for app_user_id=${userId}; skipping cancel/expire updates`,
              );
              console.log('[RevenueCat] Could not find user for id:', userId);
              return;
            }

            const updatedUser = await tx.user.update({ where: { id: userId }, data: { subscribed: false } });
            console.log('[RevenueCat] User updated subscribed=false:', updatedUser);

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
            console.log('[RevenueCat] Deleted subscription result:', deletedResult);
          });
          this.logger.log(`Cancel/expire handled eventId=${eventId}`);
          console.log('[RevenueCat] Cancel/expire flow completed for eventId=', eventId);
        } catch (err) {
          this.logger.error(`Error processing cancel/expire event ${eventId}`, err as any);
          console.log('[RevenueCat] Error processing cancel/expire event', eventId, err);
        }

        return { ok: true };
      }

      // Default: record the webhook for idempotency and investigate later
      this.logger.log(
        `[RevenueCat] Unhandled event type=${type}; recording processedWebhook eventId=${eventId}`,
      );
      try {
        console.log('[RevenueCat] Unhandled event type, details:', { id: eventId, type, productId, app_user_id: userId });
      } catch (e) {
        console.log('[RevenueCat] Unhandled event type (raw event):', event);
      }
      await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
      return { ok: true };
    } catch (err) {
      this.logger.error('Unexpected error in handleWebhook', err as any);
      // Always ack to prevent webhook retries; ops can investigate logs
      return { ok: true };
    }
  }
}

