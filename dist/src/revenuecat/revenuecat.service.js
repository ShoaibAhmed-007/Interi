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
        if (!event || !event.id || !event.type) {
            this.logger.warn('Invalid event payload');
            return { ok: true };
        }
        const eventId = event.id;
        const existing = await this.prisma.processedWebhook.findUnique({ where: { id: eventId } });
        if (existing)
            return { ok: true };
        const type = event.type;
        if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL') {
            const productId = event.product_id ?? event.productId ?? '';
            const mapping = {
                plan_499_usd_50_uses: 50,
                plan_999_usd_120_uses: 120,
            };
            const credits = mapping[productId];
            const userId = event.app_user_id ?? event.appUserId;
            const transactionIdentifier = event.transaction_id ?? event.transactionId ?? null;
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
        await this.prisma.processedWebhook.create({ data: { id: eventId, type } });
        return { ok: true };
    }
};
exports.RevenueCatService = RevenueCatService;
exports.RevenueCatService = RevenueCatService = RevenueCatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RevenueCatService);
//# sourceMappingURL=revenuecat.service.js.map