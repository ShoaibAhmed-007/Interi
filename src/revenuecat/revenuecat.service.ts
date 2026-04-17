import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);
  constructor(private prisma: PrismaService) {}

  async handleWebhook(payload: any) {
    const event = payload?.event ?? payload;
    console.log(`[RevenueCat] Incoming payload:`, payload);
    console.log(`[RevenueCat] Resolved event:`, event);
    if (!event || !event.id || !event.type) {
      this.logger.warn('Invalid event payload');
      console.log(`[RevenueCat] Invalid event payload. Exiting early.`);
      return { ok: true };
    }
    console.log(`Event: ${JSON.stringify(event)}`);
    const eventId = event.id;
    console.log(`Event Id: ${eventId}`);

    // Idempotency check
    const existing = await this.prisma.processedWebhook.findUnique({
      where: { id: eventId },
    });
    if (existing) {
      console.log(`Existing: ${JSON.stringify(existing)}`);
      console.log(
        `[RevenueCat] Event already processed. Skipping duplicate eventId=${eventId}`,
      );
      return { ok: true };
    }
    console.log(`Existing: ${existing}`);

    const type = event.type;
    console.log(`Event Type: ${type}`);

    if (
      type === 'INITIAL_PURCHASE' ||
      type === 'RENEWAL' ||
      type === 'NON_RENEWING_PURCHASE'
    ) {
      console.log(
        `[RevenueCat] Handling subscription purchase/renewal event type=${type}`,
      );
      // Use a transaction: create processed webhook, update user, create subscription
      const productId = event.product_id ?? event.productId ?? '';
      console.log(`Product Id: ${productId}`);
      const mapping: Record<string, number> = {
        // Current offerings
        plan_499_usd_50_uses: 50,
        plan_999_usd_120_uses: 120,
      };

      const credits = mapping[productId];
      console.log(`Credits: ${credits}`);
      const userId = event.app_user_id ?? event.appUserId;
      console.log(`User Id: ${userId}`);
      const transactionIdentifier =
        event.transaction_id ?? event.transactionId ?? null;
      console.log(`Transaction Identifier: ${transactionIdentifier}`);

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

      const startDate =
        parseDate(event, [
          'purchase_date_ms',
          'purchase_date',
          'purchaseDate',
        ]) ?? new Date();
      const endDate =
        parseDate(event, ['expires_date_ms', 'expires_date', 'expiresDate']) ??
        new Date();
      console.log(`Start Date: ${startDate.toISOString()}`);
      console.log(`End Date: ${endDate.toISOString()}`);

      if (!credits) {
        this.logger.warn(
          'RevenueCat webhook received unknown product_id; recording event only',
          {
            eventId,
            type,
            productId,
          },
        );
        console.log(
          `[RevenueCat] Unknown product mapping. Recording webhook only for eventId=${eventId}`,
        );

        await this.prisma.processedWebhook.create({
          data: { id: eventId, type },
        });
        console.log(
          `[RevenueCat] processedWebhook created for unknown product eventId=${eventId}`,
        );
        return { ok: true };
      }

      console.log(
        `[RevenueCat] Starting transaction for purchase/renewal eventId=${eventId}`,
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.processedWebhook.create({ data: { id: eventId, type } });
        console.log(
          `[RevenueCat] processedWebhook created in transaction eventId=${eventId}`,
        );

        if (userId) {
          await tx.user.update({
            where: { id: userId },
            data: { subscribed: true },
          });
          console.log(`[RevenueCat] User subscribed=true updated userId=${userId}`);

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
          console.log(
            `[RevenueCat] Subscription row created userId=${userId} credits=${credits}`,
          );
        } else {
          console.log(
            `[RevenueCat] No userId present. Skipped user/subscription updates.`,
          );
        }
      });
      console.log(
        `[RevenueCat] Purchase/renewal transaction completed eventId=${eventId}`,
      );

      return { ok: true };
    }

    if (type === 'EXPIRATION') {
      console.log(`[RevenueCat] Handling expiration eventId=${eventId}`);
      const userId = event.app_user_id ?? event.appUserId;
      console.log(`User Id: ${userId}`);
      const now = new Date();
      console.log(`Expiration Effective Time: ${now.toISOString()}`);
      await this.prisma.$transaction(async (tx) => {
        await tx.processedWebhook.create({ data: { id: eventId, type } });
        console.log(
          `[RevenueCat] processedWebhook created for expiration eventId=${eventId}`,
        );
        if (userId) {
          await tx.user.update({
            where: { id: userId },
            data: { subscribed: false },
          });
          console.log(`[RevenueCat] User subscribed=false updated userId=${userId}`);

          // Ensure any active subscriptions immediately have 0 remaining credits.
          // This is redundant for enforcement (since `subscribed=false` blocks usage),
          // but keeps DB state consistent and prevents future re-enablement from old rows.
          const activeSubs = await tx.subscription.findMany({
            where: {
              userId,
              endDate: { gt: now },
            },
          });
          console.log(
            `[RevenueCat] Active subscriptions to close: ${activeSubs.length}`,
          );

          for (const sub of activeSubs) {
            console.log(
              `[RevenueCat] Closing subscription id=${sub.id} totalCredits=${sub.totalCredits}`,
            );
            await tx.subscription.update({
              where: { id: sub.id },
              data: {
                endDate: now,
                usedCredits: sub.totalCredits,
              },
            });
          }
        } else {
          console.log(`[RevenueCat] No userId present in expiration event.`);
        }
      });
      console.log(`[RevenueCat] Expiration flow completed eventId=${eventId}`);
      return { ok: true };
    }

    // For other event types, just record processed webhook to ensure idempotency
    console.log(
      `[RevenueCat] Unhandled event type=${type}. Recording webhook only eventId=${eventId}`,
    );
    await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
    console.log(
      `[RevenueCat] processedWebhook created for unhandled event eventId=${eventId}`,
    );
    return { ok: true };
  }
}

