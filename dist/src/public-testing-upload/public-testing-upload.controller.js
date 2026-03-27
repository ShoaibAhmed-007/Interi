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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicTestingUploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const public_testing_upload_service_1 = require("./public-testing-upload.service");
const upload_test_file_dto_1 = require("./dto/upload-test-file.dto");
let PublicTestingUploadController = class PublicTestingUploadController {
    publicTestingUploadService;
    constructor(publicTestingUploadService) {
        this.publicTestingUploadService = publicTestingUploadService;
    }
    async uploadTestFile(file, dto) {
        return this.publicTestingUploadService.uploadForTesting(file, dto.fileType);
    }
};
exports.PublicTestingUploadController = PublicTestingUploadController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({
        summary: 'Public testing upload to S3 (JWT bypassed)',
        description: 'Testing endpoint that accepts file + fileType, uploads to S3 via backend, and returns s3Key.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        description: 'Upload payload for testing S3 upload.',
        schema: {
            type: 'object',
            properties: {
                fileType: {
                    type: 'string',
                    example: 'image/jpeg',
                    description: 'MIME type of the file.',
                },
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Binary file payload.',
                },
            },
            required: ['fileType', 'file'],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'File uploaded successfully to S3.',
        schema: {
            example: {
                success: true,
                s3Key: 'interior-app/8f6f7f9d-2f5d-4e7d-8f08-b63f2dc7ad8f.jpg',
                publicUrl: 'https://bucket-name.s3.region.amazonaws.com/interior-app/8f6f7f9d-2f5d-4e7d-8f08-b63f2dc7ad8f.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...',
                rawPublicUrl: 'https://bucket-name.s3.region.amazonaws.com/interior-app/8f6f7f9d-2f5d-4e7d-8f08-b63f2dc7ad8f.jpg',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing file or fileType.' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object, upload_test_file_dto_1.UploadTestFileDto]),
    __metadata("design:returntype", Promise)
], PublicTestingUploadController.prototype, "uploadTestFile", null);
exports.PublicTestingUploadController = PublicTestingUploadController = __decorate([
    (0, swagger_1.ApiTags)('public-testing-upload'),
    (0, common_1.Controller)('public-testing-upload'),
    __metadata("design:paramtypes", [public_testing_upload_service_1.PublicTestingUploadService])
], PublicTestingUploadController);
//# sourceMappingURL=public-testing-upload.controller.js.map