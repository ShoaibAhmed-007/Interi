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
        plan_10_usd_10_uses: 10,
        plan_50_usd_50_uses: 50,
        plan_100_usd_100_uses: 100,
      };

      const credits = mapping[productId] ?? 0;

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
      await this.prisma.$transaction(async (tx) => {
        await tx.processedWebhook.create({ data: { id: eventId, type } });
        if (userId) {
          await tx.user.update({ where: { id: userId }, data: { subscribed: false } });
        }
      });
      return { ok: true };
    }

    // For other event types, just record processed webhook to ensure idempotency
    await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
    return { ok: true };
  }
}
