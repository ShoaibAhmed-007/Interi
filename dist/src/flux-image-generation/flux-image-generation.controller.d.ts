import { FluxImageGenerationService } from './flux-image-generation.service';
export declare class FluxImageGenerationController {
    private readonly fluxImageGenerationService;
    constructor(fluxImageGenerationService: FluxImageGenerationService);
    getImage(designId: string, userId: string): unknown;
}
