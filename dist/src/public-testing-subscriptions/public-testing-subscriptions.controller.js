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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicTestingSubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const add_subscriptions_dto_1 = require("./dto/add-subscriptions.dto");
const public_testing_subscriptions_service_1 = require("./public-testing-subscriptions.service");
let PublicTestingSubscriptionsController = class PublicTestingSubscriptionsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async addSubscriptions(dto) {
        const result = await this.svc.addSubscriptions(dto.userId, dto.credits, dto.subscriptionName);
        return { success: true, ...result };
    }
};
exports.PublicTestingSubscriptionsController = PublicTestingSubscriptionsController;
__decorate([
    (0, common_1.Post)('add-subscriptions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add subscriptions (public testing endpoint)',
        description: 'Public testing endpoint: creates a Subscription row for a user, sets `subscribed=true`, and assigns the given total credits. Do not expose in production.',
    }),
    (0, swagger_1.ApiBody)({ type: add_subscriptions_dto_1.AddSubscriptionsDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Subscription added successfully.',
        schema: {
            example: {
                success: true,
                userId: 'a1b2c3d4-uuid',
                subscribed: true,
                subscription: {
                    id: 'sub-uuid',
                    totalCredits: 50,
                    usedCredits: 0,
                    startDate: '2026-05-06T00:00:00.000Z',
                    endDate: '2027-05-06T00:00:00.000Z',
                    transactionIdentifier: 'test:plan_499_usd_50_uses:...',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid payload or user not found.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_subscriptions_dto_1.AddSubscriptionsDto]),
    __metadata("design:returntype", Promise)
], PublicTestingSubscriptionsController.prototype, "addSubscriptions", null);
exports.PublicTestingSubscriptionsController = PublicTestingSubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('public-testing-subscriptions'),
    (0, common_1.Controller)('public-testing-subscriptions'),
    __metadata("design:paramtypes", [public_testing_subscriptions_service_1.PublicTestingSubscriptionsService])
], PublicTestingSubscriptionsController);
//# sourceMappingURL=public-testing-subscriptions.controller.js.map