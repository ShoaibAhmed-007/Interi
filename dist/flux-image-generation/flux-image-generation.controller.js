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
exports.FluxImageGenerationController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const get_user_decorator_1 = require("../auth/decorator/get-user.decorator");
const flux_image_generation_service_1 = require("./flux-image-generation.service");
let FluxImageGenerationController = class FluxImageGenerationController {
    fluxImageGenerationService;
    constructor(fluxImageGenerationService) {
        this.fluxImageGenerationService = fluxImageGenerationService;
    }
    async getImage(designId, userId) {
        if (!designId) {
            throw new common_1.BadRequestException('designId is required');
        }
        await this.fluxImageGenerationService.checkForCredits(userId);
        const result = await this.fluxImageGenerationService.generateImageForDesign(designId);
        return {
            success: true,
            ...result,
        };
    }
};
exports.FluxImageGenerationController = FluxImageGenerationController;
__decorate([
    (0, common_1.Post)('flux-image-generation'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate an AI image via Flux Pro from an uploaded image',
        description: 'Generates an AI image for an existing Design entry (by designId). Uses the Design record (category, location, style, colorPalette and originalImageUrl) as input and stores the result in S3. Requires a valid JWT token.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                designId: { type: 'string', example: 'a1b2c3d4-uuid' },
            },
            required: ['designId'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Image generated successfully via Flux' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized — invalid or missing JWT' }),
    __param(0, (0, common_1.Body)('designId')),
    __param(1, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FluxImageGenerationController.prototype, "getImage", null);
exports.FluxImageGenerationController = FluxImageGenerationController = __decorate([
    (0, swagger_1.ApiTags)('flux-image-generation'),
    (0, common_1.Controller)('flux-image-generation'),
    __metadata("design:paramtypes", [flux_image_generation_service_1.FluxImageGenerationService])
], FluxImageGenerationController);
//# sourceMappingURL=flux-image-generation.controller.js.map