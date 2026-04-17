import { PrismaService } from '../prisma/prisma.service';
export declare class RevenueCatService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleWebhook(payload: any): Promise<{
        ok: boolean;
    }>;
}
