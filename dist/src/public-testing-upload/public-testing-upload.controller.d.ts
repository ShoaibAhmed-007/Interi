import { PublicTestingUploadService } from './public-testing-upload.service';
import { UploadTestFileDto } from './dto/upload-test-file.dto';
export declare class PublicTestingUploadController {
    private readonly publicTestingUploadService;
    constructor(publicTestingUploadService: PublicTestingUploadService);
    uploadTestFile(file: Express.Multer.File, dto: UploadTestFileDto): Promise<{
        success: boolean;
        s3Key: string;
        publicUrl: string;
        rawPublicUrl: string;
    }>;
}
