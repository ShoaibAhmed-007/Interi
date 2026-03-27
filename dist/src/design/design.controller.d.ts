import { DesignService } from './design.service';
import { CreateDesignDto } from './dto/create-design.dto';
export declare class DesignController {
    private readonly designService;
    constructor(designService: DesignService);
    createDesign(userId: string, createDesignDto: CreateDesignDto): unknown;
}
