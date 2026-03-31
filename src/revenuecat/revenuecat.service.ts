import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);
  constructor(private prisma: PrismaService) {}

  async handleWebhook(payload: any) {
    const event = payload?.event ?? payload;
    if (!event || !event.id || !event.type) {
      this.logger.warn('Invalid event payload');
      return { ok: true };
    }

    const eventId = event.id;

    // Idempotency check
    const existing = await this.prisma.processedWebhook.findUnique({ where: { id: eventId } });
    if (existing) return { ok: true };

    const type = event.type;

    if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL') {
      // Use a transaction: create processed webhook, update user, create subscription
      const productId = event.product_id ?? event.productId ?? '';

      const mapping: Record<string, number> = {
        // Current offerings
        plan_499_usd_50_uses: 50,
        plan_999_usd_120_uses: 120,
      };

      const credits = mapping[productId];

      const userId = event.app_user_id ?? event.appUserId;
      const transactionIdentifier = event.transaction_id ?? event.transactionId ?? null;

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

      const startDate = parseDate(event, ['purchase_date_ms', 'purchase_date', 'purchaseDate']) ?? new Date();
      const endDate = parseDate(event, ['expires_date_ms', 'expires_date', 'expiresDate']) ?? new Date();

      if (!credits) {
        this.logger.warn('RevenueCat webhook received unknown product_id; recording event only', {
          eventId,
          type,
          productId,
        });

        await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
        return { ok: true };
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.processedWebhook.create({ data: { id: eventId, type } });

        if (userId) {
          await tx.user.update({ where: { id: userId }, data: { subscribed: true } });

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
        }
      });

      return { ok: true };
    }

    if (type === 'EXPIRATION') {
      const userId = event.app_user_id ?? event.appUserId;
      const now = new Date();
      await this.prisma.$transaction(async (tx) => {
        await tx.processedWebhook.create({ data: { id: eventId, type } });
        if (userId) {
          await tx.user.update({ where: { id: userId }, data: { subscribed: false } });

          // Ensure any active subscriptions immediately have 0 remaining credits.
          // This is redundant for enforcement (since `subscribed=false` blocks usage),
          // but keeps DB state consistent and prevents future re-enablement from old rows.
          const activeSubs = await tx.subscription.findMany({
            where: {
              userId,
              endDate: { gt: now },
            },
          });

          for (const sub of activeSubs) {
            await tx.subscription.update({
              where: { id: sub.id },
              data: {
                endDate: now,
                usedCredits: sub.totalCredits,
              },
            });
          }
        }
      });
      return { ok: true };
    }

    // For other event types, just record processed webhook to ensure idempotency
    await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
    return { ok: true };
  }
}
