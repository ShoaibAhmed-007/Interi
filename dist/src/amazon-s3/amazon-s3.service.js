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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonS3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
let AmazonS3Service = class AmazonS3Service {
    configService;
    s3Client;
    bucketName;
    region;
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.getOrThrow('AWS_REGION');
        this.bucketName = this.configService.getOrThrow('AWS_S3_BUCKET');
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
            },
        });
    }
    async generatePresignedUploadUrl(fileType, expiresIn = 300) {
        let fileExtension = '';
        if (fileType) {
            const mime = fileType.split('/')[1];
            if (mime) {
                if (mime.includes('jpeg'))
                    fileExtension = 'jpg';
                else if (mime.includes('png'))
                    fileExtension = 'png';
                else if (mime.includes('webp'))
                    fileExtension = 'webp';
                else
                    fileExtension = mime.replace(/[^a-z0-9]/gi, '') || 'bin';
            }
        }
        const uniqueKey = fileExtension ? `interior-app/${(0, uuid_1.v4)()}.${fileExtension}` : `interior-app/${(0, uuid_1.v4)()}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: uniqueKey,
            ContentType: fileType,
        });
        try {
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
            const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${uniqueKey}`;
            return { uploadUrl, publicUrl, s3Key: uniqueKey };
        }
        catch (error) {
            console.error('[AmazonS3Service] Failed to generate pre-signed URL:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to generate S3 pre-signed URL.');
        }
    }
    async uploadBuffer(buffer, fileExtension = 'jpg', contentType = 'image/jpeg') {
        const uniqueKey = `interior-app/${(0, uuid_1.v4)()}.${fileExtension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: uniqueKey,
            Body: buffer,
            ContentType: contentType,
        });
        try {
            await this.s3Client.send(command);
            const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${uniqueKey}`;
            return { publicUrl, s3Key: uniqueKey };
        }
        catch (error) {
            console.error('[AmazonS3Service] Failed to upload buffer to S3:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to upload file to S3.');
        }
    }
    async downloadBuffer(s3Key) {
        const command = new client_s3_1.GetObjectCommand({ Bucket: this.bucketName, Key: s3Key });
        try {
            const response = await this.s3Client.send(command);
            const stream = response.Body;
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);
            const contentType = response.ContentType || 'application/octet-stream';
            return { buffer, contentType };
        }
        catch (error) {
            console.error('[AmazonS3Service] Failed to download object from S3:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to download file from S3.');
        }
    }
    async generatePresignedDownloadUrl(s3Key, expiresIn = 3600) {
        const command = new client_s3_1.GetObjectCommand({ Bucket: this.bucketName, Key: s3Key });
        try {
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
            return url;
        }
        catch (error) {
            console.error('[AmazonS3Service] Failed to generate presigned GET URL:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to generate presigned download URL.');
        }
    }
    async generatePresignedUploadUrlForKey(s3Key, fileType, expiresIn = 300) {
        const command = new client_s3_1.PutObjectCommand({ Bucket: this.bucketName, Key: s3Key, ContentType: fileType });
        try {
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
            const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
            return { uploadUrl, publicUrl, s3Key };
        }
        catch (error) {
            console.error('[AmazonS3Service] Failed to generate presigned upload URL for key:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to generate presigned upload URL for existing key.');
        }
    }
};
exports.AmazonS3Service = AmazonS3Service;
exports.AmazonS3Service = AmazonS3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], AmazonS3Service);
//# sourceMappingURL=amazon-s3.service.js.map