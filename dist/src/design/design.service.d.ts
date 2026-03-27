import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignDto } from './dto/create-design.dto';
export declare class DesignService {
    private prisma;
    constructor(prisma: PrismaService);
    createDesign(userId: string, createDesignDto: CreateDesignDto): unknown;
}
