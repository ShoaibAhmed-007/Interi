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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiPromptGenerationController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const openai_prompt_generation_service_1 = require("./openai-prompt-generation.service");
const get_user_decorator_1 = require("../auth/decorator/get-user.decorator");
let OpenaiPromptGenerationController = class OpenaiPromptGenerationController {
    openaiPromptGenerationService;
    constructor(openaiPromptGenerationService) {
        this.openaiPromptGenerationService = openaiPromptGenerationService;
    }
    async getPictureGeneration(userId, designId) {
        const prompt = await this.openaiPromptGenerationService.generatePromptFromDesign(designId, userId);
        console.log(`[OpenAI Prompt] Generated for user ${userId}, design ${designId}:`);
        console.log(prompt);
        return {
            success: true,
            prompt,
        };
    }
    async publicGeneratePrompt(designId, image) {
        if (!image) {
            throw new Error('Image file is required');
        }
        const result = await this.openaiPromptGenerationService.generatePromptWithImage(designId, image.buffer);
        console.log(`\n--- Cost Summary (Prompt Only) ---`);
        console.log(`[gpt-4o-mini] Tokens: ${result.tokens.total} (in: ${result.tokens.input}, out: ${result.tokens.output}) | Cost: $${result.cost.toFixed(6)}`);
        console.log(`----------------------------------\n`);
        return {
            success: true,
            ...result,
        };
    }
    async publicGenerateImage(designId, image) {
        if (!image) {
            throw new Error('Image file is required');
        }
        const result = await this.openaiPromptGenerationService.generateImageWithImage(designId, image.buffer);
        return {
            success: true,
            ...result,
        };
    }
    async publicGenerateImageDto(style, colorPalette, location, category, image) {
        if (!image) {
            throw new Error('Image file is required');
        }
        const dto = { style, colorPalette, location, category };
        const result = await this.openaiPromptGenerationService.generateImageWithDto(dto, image.buffer);
        return {
            success: true,
            ...result,
        };
    }
    async publicAdvancedEdit(designId, prompt, image) {
        if (!image) {
            throw new Error('Image file is required');
        }
        const result = await this.openaiPromptGenerationService.processAdvancedImageEdit(designId, image.buffer, prompt);
        return {
            success: true,
            ...result,
        };
    }
};
exports.OpenaiPromptGenerationController = OpenaiPromptGenerationController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('get-picture-generation'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate a descriptive AI image prompt from a saved design',
        description: 'Looks up the design by `designId`, verifies it belongs to the authenticated user, then uses GPT-4o-mini to generate a detailed image generation prompt from the design attributes. Requires a valid JWT token.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'designId',
        required: true,
        example: 'clx1abc...uuid...',
        description: 'The UUID of the design to generate a prompt for',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Prompt generated successfully',
        schema: {
            example: {
                success: true,
                prompt: 'A breathtaking modern living room bathed in warm afternoon sunlight...',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized — invalid or missing JWT' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Design not found or does not belong to user' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Failed to generate prompt from OpenAI' }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Query)('designId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OpenaiPromptGenerationController.prototype, "getPictureGeneration", null);
__decorate([
    (0, common_1.Post)('public-generate-prompt'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate a descriptive AI image prompt from a saved design and an uploaded image',
        description: 'Public endpoint that takes an image and a designId without JWT authentication.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                designId: { type: 'string', example: 'clx...uuid' },
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Prompt generated successfully along with cost metrics' }),
    __param(0, (0, common_1.Body)('designId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], OpenaiPromptGenerationController.prototype, "publicGeneratePrompt", null);
__decorate([
    (0, common_1.Post)('public-generate-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate an AI image directly from a saved design and an uploaded image',
        description: 'Public endpoint that creates the prompt and then generates an image using DALL-E 3.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                designId: { type: 'string', example: 'clx...uuid' },
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Image generated successfully along with cost metrics' }),
    __param(0, (0, common_1.Body)('designId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof Express !== "undefined" && (_c = Express.Multer) !== void 0 && _c.File) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], OpenaiPromptGenerationController.prototype, "publicGenerateImage", null);
__decorate([
    (0, common_1.Post)('public-generate-image-dto'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate an AI image directly from DTO parameters and an uploaded image',
        description: 'Public endpoint that takes design DTO parameters (style, colorPalette, location, category) and an image, without relying on a saved design ID.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                style: { type: 'string', example: 'Modern Minimalist' },
                colorPalette: { type: 'string', example: 'Warm earth tones' },
                location: { type: 'string', example: 'Living Room' },
                category: { type: 'string', example: 'Residential' },
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Image generated successfully along with cost metrics' }),
    __param(0, (0, common_1.Body)('style')),
    __param(1, (0, common_1.Body)('colorPalette')),
    __param(2, (0, common_1.Body)('location')),
    __param(3, (0, common_1.Body)('category')),
    __param(4, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, typeof (_f = typeof Express !== "undefined" && (_e = Express.Multer) !== void 0 && _e.File) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], OpenaiPromptGenerationController.prototype, "publicGenerateImageDto", null);
__decorate([
    (0, common_1.Post)('public-advanced-edit'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({
        summary: 'Advanced image editing pipeline using Room Segmentation, MiDaS Depth Mapping, and Empty Floor Detection to generate decor masks.',
        description: 'Public endpoint that processes an uploaded image through a complex computer vision pipeline to generate masks, and then calls OpenAI Image Edit.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                designId: { type: 'string', example: 'clx...uuid' },
                prompt: { type: 'string', example: 'Add a modern velvet sofa on the floor', description: 'Describe what decor to add' },
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Final decor image generated successfully' }),
    __param(0, (0, common_1.Body)('designId')),
    __param(1, (0, common_1.Body)('prompt')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_h = typeof Express !== "undefined" && (_g = Express.Multer) !== void 0 && _g.File) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], OpenaiPromptGenerationController.prototype, "publicAdvancedEdit", null);
exports.OpenaiPromptGenerationController = OpenaiPromptGenerationController = __decorate([
    (0, swagger_1.ApiTags)('openai-prompt-generation'),
    (0, common_1.Controller)('openai-prompt-generation'),
    __metadata("design:paramtypes", [openai_prompt_generation_service_1.OpenaiPromptGenerationService])
], OpenaiPromptGenerationController);
//# sourceMappingURL=openai-prompt-generation.controller.js.map