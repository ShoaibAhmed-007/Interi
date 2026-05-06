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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicTestingSubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let PublicTestingSubscriptionsService = class PublicTestingSubscriptionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addSubscriptions(userId, totalCredits, subscriptionName) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const now = new Date();
        const endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);
        const transactionIdentifier = `test:${subscriptionName}:${(0, crypto_1.randomUUID)()}`;
        const [updatedUser, subscription] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { subscribed: true },
            }),
            this.prisma.subscription.create({
                data: {
                    userId,
                    totalCredits,
                    usedCredits: 0,
                    startDate: now,
                    endDate,
                    transactionIdentifier,
                },
            }),
        ]);
        return {
            userId: updatedUser.id,
            subscribed: updatedUser.subscribed,
            subscription,
        };
    }
};
exports.PublicTestingSubscriptionsService = PublicTestingSubscriptionsService;
exports.PublicTestingSubscriptionsService = PublicTestingSubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicTestingSubscriptionsService);
//# sourceMappingURL=public-testing-subscriptions.service.js.map