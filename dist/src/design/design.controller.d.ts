import { DesignService } from './design.service';
import { CreateDesignDto } from './dto/create-design.dto';
export declare class DesignController {
    private readonly designService;
    constructor(designService: DesignService);
    createDesign(userId: string, createDesignDto: CreateDesignDto): Promise<{
        createdAt: Date;
        id: string;
        style: string;
        category: string;
        originalImageUrl: string;
        location: string;
        colorPalette: string;
        seedUsed: bigint | null;
        resultImageUrl: string | null;
        userId: string;
    }>;
}
