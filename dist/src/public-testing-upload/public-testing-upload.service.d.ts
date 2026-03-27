import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
export declare class PublicTestingUploadService {
    private readonly s3;
    constructor(s3: AmazonS3Service);
    uploadForTesting(file: Express.Multer.File, fileType: string): Promise<{
        success: boolean;
        s3Key: string;
        publicUrl: string;
        rawPublicUrl: string;
    }>;
    private getExtensionFromMime;
}
