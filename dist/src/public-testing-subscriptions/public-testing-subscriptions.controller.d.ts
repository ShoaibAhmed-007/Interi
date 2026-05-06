import { AddSubscriptionsDto } from './dto/add-subscriptions.dto';
import { PublicTestingSubscriptionsService } from './public-testing-subscriptions.service';
export declare class PublicTestingSubscriptionsController {
    private readonly svc;
    constructor(svc: PublicTestingSubscriptionsService);
    addSubscriptions(dto: AddSubscriptionsDto): Promise<{
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
        success: boolean;
    }>;
}
