import { FluxImageGenerationService } from './flux-image-generation.service';
import { ApplyStyleDto } from './dto/apply-style.dto';
export declare class FluxImageGenerationController {
    private readonly fluxImageGenerationService;
    constructor(fluxImageGenerationService: FluxImageGenerationService);
    getImage(designId: string, userId: string): Promise<{
        imageUrl: string;
        presignedUrl: string;
        promptUsed: string;
        s3Key: string;
        success: boolean;
    }>;
    applyStyle(dto: ApplyStyleDto, userId: string): Promise<{
        s3Key: string;
        publicUrl: string;
        unsignedUrl: string;
        success: boolean;
    }>;
}
