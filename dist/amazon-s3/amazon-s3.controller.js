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
exports.AmazonS3Controller = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const amazon_s3_service_1 = require("./amazon-s3.service");
let AmazonS3Controller = class AmazonS3Controller {
    amazonS3Service;
    constructor(amazonS3Service) {
        this.amazonS3Service = amazonS3Service;
    }
    async getPresignedUrl(fileType) {
        if (!fileType) {
            throw new common_1.BadRequestException('Query parameter "fileType" is required.');
        }
        const { uploadUrl, publicUrl, s3Key } = await this.amazonS3Service.generatePresignedUploadUrl(fileType);
        return { uploadUrl, publicUrl, s3Key };
    }
};
exports.AmazonS3Controller = AmazonS3Controller;
__decorate([
    (0, common_1.Get)('presigned-url'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a pre-signed S3 upload URL',
        description: 'Returns a temporary uploadUrl (PUT to this from your client) and the permanent publicUrl where the image will be accessible after upload.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'fileType', required: true, example: 'image/jpeg' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Pre-signed URL generated successfully.',
        schema: {
            example: {
                uploadUrl: 'https://swiftnine-apps.s3.eu-north-1.amazonaws.com/interior-app/<uuid>.jpg?X-Amz-...',
                publicUrl: 'https://swiftnine-apps.s3.eu-north-1.amazonaws.com/interior-app/<uuid>.jpg',
                s3Key: 'interior-app/<uuid>.jpg',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing or invalid query parameters.' }),
    __param(0, (0, common_1.Query)('fileType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AmazonS3Controller.prototype, "getPresignedUrl", null);
exports.AmazonS3Controller = AmazonS3Controller = __decorate([
    (0, swagger_1.ApiTags)('S3'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('s3'),
    __metadata("design:paramtypes", [amazon_s3_service_1.AmazonS3Service])
], AmazonS3Controller);
//# sourceMappingURL=amazon-s3.controller.js.map