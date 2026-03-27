import { OpenaiPromptGenerationService } from './openai-prompt-generation.service';
export declare class OpenaiPromptGenerationController {
    private readonly openaiPromptGenerationService;
    constructor(openaiPromptGenerationService: OpenaiPromptGenerationService);
    getPictureGeneration(userId: string, designId: string): unknown;
    publicGeneratePrompt(designId: string, image: Express.Multer.File): unknown;
    publicGenerateImage(designId: string, image: Express.Multer.File): unknown;
    publicGenerateImageDto(style: string, colorPalette: string, location: string, category: string, image: Express.Multer.File): unknown;
    publicAdvancedEdit(designId: string, prompt: string, image: Express.Multer.File): unknown;
}
