import { PrismaService } from '../prisma/prisma.service';
export declare class PublicTestingSubscriptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    addSubscriptions(userId: string, totalCredits: number, subscriptionName: string): Promise<{
        userId: string;
        subscribed: boolean;
        subscription: {
            userId: string;
            id: string;
            createdAt: Date;
            totalCredits: number;
            usedCredits: number;
            transactionIdentifier: string | null;
            startDate: Date;
            endDate: Date;
        };
    }>;
}
