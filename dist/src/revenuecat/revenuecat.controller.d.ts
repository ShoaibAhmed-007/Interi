import { RevenueCatService } from './revenuecat.service';
export declare class RevenueCatController {
    private readonly svc;
    constructor(svc: RevenueCatService);
    receive(body: any): Promise<{
        ok: boolean;
    }>;
}
