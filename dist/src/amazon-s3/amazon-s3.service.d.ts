import { ConfigService } from '@nestjs/config';
export declare class AmazonS3Service {
    private readonly configService;
    private readonly s3Client;
    private readonly bucketName;
    private readonly region;
    constructor(configService: ConfigService);
    generatePresignedUploadUrl(fileType: string, expiresIn?: number): Promise<{
        uploadUrl: string;
        publicUrl: string;
        s3Key: string;
    }>;
    uploadBuffer(buffer: Buffer, fileExtension?: string, contentType?: string): Promise<{
        publicUrl: string;
        s3Key: string;
    }>;
    downloadBuffer(s3Key: string): Promise<{
        buffer: Buffer;
        contentType: string;
    }>;
    generatePresignedDownloadUrl(s3Key: string, expiresIn?: number): Promise<string>;
    generatePresignedUploadUrlForKey(s3Key: string, fileType: string, expiresIn?: number): Promise<{
        uploadUrl: string;
        publicUrl: string;
        s3Key: string;
    }>;
}
