"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RevenueCatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueCatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RevenueCatService = RevenueCatService_1 = class RevenueCatService {
    prisma;
    logger = new common_1.Logger(RevenueCatService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleWebhook(payload) {
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
        const existing = await this.prisma.processedWebhook.findUnique({
            where: { id: eventId },
        });
        if (existing) {
            console.log(`Existing: ${JSON.stringify(existing)}`);
            console.log(`[RevenueCat] Event already processed. Skipping duplicate eventId=${eventId}`);
            return { ok: true };
        }
        console.log(`Existing: ${existing}`);
        const type = event.type;
        console.log(`Event Type: ${type}`);
        if (type === 'INITIAL_PURCHASE' ||
            type === 'RENEWAL' ||
            type === 'NON_RENEWING_PURCHASE') {
            console.log(`[RevenueCat] Handling subscription purchase/renewal event type=${type}`);
            const productId = event.product_id ?? event.productId ?? '';
            console.log(`Product Id: ${productId}`);
            const mapping = {
                plan_499_usd_50_uses: 50,
                plan_999_usd_120_uses: 120,
            };
            const credits = mapping[productId];
            console.log(`Credits: ${credits}`);
            const userId = event.app_user_id ?? event.appUserId;
            console.log(`User Id: ${userId}`);
            const transactionIdentifier = event.transaction_id ?? event.transactionId ?? null;
            console.log(`Transaction Identifier: ${transactionIdentifier}`);
            const parseDate = (obj, keys) => {
                for (const k of keys) {
                    const v = obj[k];
                    if (v === undefined || v === null)
                        continue;
                    if (typeof v === 'number')
                        return new Date(v);
                    if (typeof v === 'string') {
                        if (/^\d+$/.test(v))
                            return new Date(Number(v));
                        const d = new Date(v);
                        if (!isNaN(d.getTime()))
                            return d;
                    }
                }
                return null;
            };
            const startDate = parseDate(event, [
                'purchase_date_ms',
                'purchase_date',
                'purchaseDate',
            ]) ?? new Date();
            const endDate = parseDate(event, ['expires_date_ms', 'expires_date', 'expiresDate']) ??
                new Date();
            console.log(`Start Date: ${startDate.toISOString()}`);
            console.log(`End Date: ${endDate.toISOString()}`);
            if (!credits) {
                this.logger.warn('RevenueCat webhook received unknown product_id; recording event only', {
                    eventId,
                    type,
                    productId,
                });
                console.log(`[RevenueCat] Unknown product mapping. Recording webhook only for eventId=${eventId}`);
                await this.prisma.processedWebhook.create({
                    data: { id: eventId, type },
                });
                console.log(`[RevenueCat] processedWebhook created for unknown product eventId=${eventId}`);
                return { ok: true };
            }
            console.log(`[RevenueCat] Starting transaction for purchase/renewal eventId=${eventId}`);
            await this.prisma.$transaction(async (tx) => {
                await tx.processedWebhook.create({ data: { id: eventId, type } });
                console.log(`[RevenueCat] processedWebhook created in transaction eventId=${eventId}`);
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
                    console.log(`[RevenueCat] Subscription row created userId=${userId} credits=${credits}`);
                }
                else {
                    console.log(`[RevenueCat] No userId present. Skipped user/subscription updates.`);
                }
            });
            console.log(`[RevenueCat] Purchase/renewal transaction completed eventId=${eventId}`);
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
                console.log(`[RevenueCat] processedWebhook created for expiration eventId=${eventId}`);
                if (userId) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { subscribed: false },
                    });
                    console.log(`[RevenueCat] User subscribed=false updated userId=${userId}`);
                    const activeSubs = await tx.subscription.findMany({
                        where: {
                            userId,
                            endDate: { gt: now },
                        },
                    });
                    console.log(`[RevenueCat] Active subscriptions to close: ${activeSubs.length}`);
                    for (const sub of activeSubs) {
                        console.log(`[RevenueCat] Closing subscription id=${sub.id} totalCredits=${sub.totalCredits}`);
                        await tx.subscription.update({
                            where: { id: sub.id },
                            data: {
                                endDate: now,
                                usedCredits: sub.totalCredits,
                            },
                        });
                    }
                }
                else {
                    console.log(`[RevenueCat] No userId present in expiration event.`);
                }
            });
            console.log(`[RevenueCat] Expiration flow completed eventId=${eventId}`);
            return { ok: true };
        }
        console.log(`[RevenueCat] Unhandled event type=${type}. Recording webhook only eventId=${eventId}`);
        await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
        console.log(`[RevenueCat] processedWebhook created for unhandled event eventId=${eventId}`);
        return { ok: true };
    }
};
exports.RevenueCatService = RevenueCatService;
exports.RevenueCatService = RevenueCatService = RevenueCatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RevenueCatService);
//# sourceMappingURL=revenuecat.service.js.map