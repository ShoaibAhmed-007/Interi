import { AddSubscriptionsDto } from './dto/add-subscriptions.dto';
import { PublicTestingSubscriptionsService } from './public-testing-subscriptions.service';
export declare class PublicTestingSubscriptionsController {
    private readonly svc;
    constructor(svc: PublicTestingSubscriptionsService);
    addSubscriptions(dto: AddSubscriptionsDto): Promise<{
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
        success: boolean;
    }>;
}
