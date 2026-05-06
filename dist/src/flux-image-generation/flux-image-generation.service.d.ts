import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
export declare class FluxImageGenerationService {
    private prisma;
    private s3;
    constructor(prisma: PrismaService, s3: AmazonS3Service);
    private testDNS;
    private buildFetchDispatcher;
    private safeFetch;
    generateImageForDesign(requestingUserId: string, designId: string): Promise<{
        imageUrl: string;
        presignedUrl: string;
        promptUsed: string;
        s3Key: string;
    }>;
    checkForCredits(userId: string): Promise<void>;
    deductCredits(userId: string): Promise<void>;
    transferStyleBetweenS3Keys(userId: string, sourceKey: string, targetKey: string, location: string): Promise<{
        s3Key: string;
        publicUrl: string;
        unsignedUrl: string;
    }>;
    analyzeImageAndApplyStyle(userId: string, imgA: string, imgB: string, location?: string): Promise<{
        s3Key: string;
        publicUrl: string;
        unsignedUrl: string;
    }>;
    generateFromS3Key(userId: string, s3Key: string, prompt: string): Promise<{
        s3Key: string;
        imageUrl: string;
        publicUrl: string;
        presignedUrl: string;
    }>;
}
