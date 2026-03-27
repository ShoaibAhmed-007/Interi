import { AmazonS3Service } from './amazon-s3.service';
export declare class AmazonS3Controller {
    private readonly amazonS3Service;
    constructor(amazonS3Service: AmazonS3Service);
    getPresignedUrl(fileType: string): Promise<{
        uploadUrl: string;
        publicUrl: string;
        s3Key: string;
    }>;
}
