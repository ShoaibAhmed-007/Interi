import { PrismaService } from '../prisma/prisma.service';
export declare class PublicTestingSubscriptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    addSubscriptions(userId: string, totalCredits: number, subscriptionName: string): Promise<{
        userId: string;
        subscribed: boolean;
        subscription: {
            id: string;
            createdAt: Date;
            userId: string;
            totalCredits: number;
            usedCredits: number;
            startDate: Date;
            endDate: Date;
            transactionIdentifier: string | null;
        };
    }>;
}
