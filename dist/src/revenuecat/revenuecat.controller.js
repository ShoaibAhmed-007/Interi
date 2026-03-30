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
exports.RevenueCatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const revenuecat_guard_1 = require("./revenuecat.guard");
const revenuecat_service_1 = require("./revenuecat.service");
let RevenueCatController = class RevenueCatController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async receive(body) {
        return this.svc.handleWebhook(body);
    }
};
exports.RevenueCatController = RevenueCatController;
__decorate([
    (0, common_1.Post)('webhooks/revenuecat'),
    (0, common_1.UseGuards)(revenuecat_guard_1.RevenueCatGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Receive RevenueCat webhooks' }),
    (0, swagger_1.ApiBody)({ description: 'RevenueCat webhook payload', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Acknowledged' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueCatController.prototype, "receive", null);
exports.RevenueCatController = RevenueCatController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [revenuecat_service_1.RevenueCatService])
], RevenueCatController);
//# sourceMappingURL=revenuecat.controller.js.map