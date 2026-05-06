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
exports.AddSubscriptionsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AddSubscriptionsDto {
    userId;
    credits;
    subscriptionName;
}
exports.AddSubscriptionsDto = AddSubscriptionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'a1b2c3d4-uuid',
        description: 'User id to grant subscription credits to (testing only).',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddSubscriptionsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 50,
        description: 'Total credits to add in the new subscription row.',
        minimum: 1,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AddSubscriptionsDto.prototype, "credits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'plan_499_usd_50_uses',
        description: 'Subscription name (testing only).',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddSubscriptionsDto.prototype, "subscriptionName", void 0);
//# sourceMappingURL=add-subscriptions.dto.js.map