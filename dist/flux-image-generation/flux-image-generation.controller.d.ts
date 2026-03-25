import { FluxImageGenerationService } from './flux-image-generation.service';
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
}
