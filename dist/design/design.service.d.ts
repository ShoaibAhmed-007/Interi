import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignDto } from './dto/create-design.dto';
export declare class DesignService {
    private prisma;
    constructor(prisma: PrismaService);
    createDesign(userId: string, createDesignDto: CreateDesignDto): Promise<{
        id: string;
        createdAt: Date;
        category: string;
        originalImageUrl: string;
        location: string;
        style: string;
        colorPalette: string;
        seedUsed: bigint | null;
        resultImageUrl: string | null;
        userId: string;
    }>;
}
