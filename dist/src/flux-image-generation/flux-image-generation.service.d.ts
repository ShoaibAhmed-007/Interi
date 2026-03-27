import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
export declare class FluxImageGenerationService {
    private prisma;
    private s3;
    constructor(prisma: PrismaService, s3: AmazonS3Service);
    private testDNS;
    private buildFetchDispatcher;
    private safeFetch;
    generateImageForDesign(designId: string): unknown;
    checkForCredits(userId: string): any;
}
