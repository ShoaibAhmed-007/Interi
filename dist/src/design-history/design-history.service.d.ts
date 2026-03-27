import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
export declare class DesignHistoryService {
    private prisma;
    private s3;
    constructor(prisma: PrismaService, s3: AmazonS3Service);
    getUserDesignHistory(userId: string): unknown;
}
