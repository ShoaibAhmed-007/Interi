import { DesignHistoryService } from './design-history.service';
export declare class DesignHistoryController {
    private readonly designHistoryService;
    constructor(designHistoryService: DesignHistoryService);
    getHistory(userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            originalImageKey: string | null;
            originalImageUrl: string | null;
            resultImageKey: string | null;
            resultImageUrl: string | null;
        }[];
    }>;
}
