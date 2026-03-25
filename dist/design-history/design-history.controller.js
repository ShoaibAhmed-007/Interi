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
exports.DesignHistoryController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const get_user_decorator_1 = require("../auth/decorator/get-user.decorator");
const design_history_service_1 = require("./design-history.service");
let DesignHistoryController = class DesignHistoryController {
    designHistoryService;
    constructor(designHistoryService) {
        this.designHistoryService = designHistoryService;
    }
    async getHistory(userId) {
        const history = await this.designHistoryService.getUserDesignHistory(userId);
        return { success: true, data: history };
    }
};
exports.DesignHistoryController = DesignHistoryController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get design history for the authenticated user', description: 'Returns designs created by the authenticated user in newest-first order, including creation time and original/final image URLs.' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Array of design history entries',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    originalImageKey: { type: 'string', nullable: true, description: 'Stored S3 key or original URL' },
                    originalImageUrl: { type: 'string', nullable: true, description: 'Presigned URL or external URL' },
                    resultImageKey: { type: 'string', nullable: true, description: 'Stored S3 key or original URL' },
                    resultImageUrl: { type: 'string', nullable: true, description: 'Presigned URL or external URL' },
                },
            },
        },
    }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DesignHistoryController.prototype, "getHistory", null);
exports.DesignHistoryController = DesignHistoryController = __decorate([
    (0, swagger_1.ApiTags)('design-history'),
    (0, common_1.Controller)('design-history'),
    __metadata("design:paramtypes", [design_history_service_1.DesignHistoryService])
], DesignHistoryController);
//# sourceMappingURL=design-history.controller.js.map