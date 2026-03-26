import { OpenaiPromptGenerationService } from './openai-prompt-generation.service';
export declare class OpenaiPromptGenerationController {
    private readonly openaiPromptGenerationService;
    constructor(openaiPromptGenerationService: OpenaiPromptGenerationService);
    getPictureGeneration(userId: string, designId: string): Promise<{
        success: boolean;
        prompt: string;
    }>;
    publicGeneratePrompt(designId: string, image: Express.Multer.File): Promise<{
        prompt: string;
        designDirective: string;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        cost: number;
        success: boolean;
    }>;
    publicGenerateImage(designId: string, image: Express.Multer.File): Promise<{
        imageUrl: string;
        roomDescription: string;
        designDirective: string;
        fullPromptSentToDalle: string;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        cost: {
            roomDescription: number;
            imageGeneration: number;
            total: number;
        };
        success: boolean;
    }>;
    publicGenerateImageDto(style: string, colorPalette: string, location: string, category: string, image: Express.Multer.File): Promise<{
        imageUrl: string;
        roomDescription: string;
        designDirective: string;
        fullPromptSentToDalle: string;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        cost: {
            roomDescription: number;
            imageGeneration: number;
            total: number;
        };
        success: boolean;
    }>;
    publicAdvancedEdit(designId: string, prompt: string, image: Express.Multer.File): Promise<{
        imageUrl: string;
        promptUsed: string;
        cost: {
            imageEditGeneration: number;
            total: number;
        };
        pipelineLog: string[];
        success: boolean;
    }>;
}
