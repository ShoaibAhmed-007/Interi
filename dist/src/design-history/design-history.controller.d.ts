import { DesignHistoryService } from './design-history.service';
export declare class DesignHistoryController {
    private readonly designHistoryService;
    constructor(designHistoryService: DesignHistoryService);
    getHistory(userId: string): unknown;
}
