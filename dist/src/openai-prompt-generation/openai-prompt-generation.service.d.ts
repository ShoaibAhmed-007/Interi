import { PrismaService } from '../prisma/prisma.service';
export declare class OpenaiPromptGenerationService {
    private prisma;
    private openai;
    constructor(prisma: PrismaService);
    generatePromptFromDesign(designId: string, userId: string): Promise<string>;
    describeRoomFromImage(imageBuffer: Buffer): Promise<{
        description: string;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        cost: number;
    }>;
    generatePromptWithImage(designId: string, imageBuffer: Buffer): Promise<{
        prompt: string;
        designDirective: string;
        tokens: {
            input: number;
            output: number;
            total: number;
        };
        cost: number;
    }>;
    generateImageWithImage(designId: string, imageBuffer: Buffer): Promise<{
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
    }>;
    generateImageWithDto(dto: {
        style: string;
        colorPalette: string;
        location: string;
        category: string;
    }, imageBuffer: Buffer): Promise<{
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
    }>;
    processAdvancedImageEdit(designId: string, imageBuffer: Buffer, userPrompt: string): Promise<{
        imageUrl: string;
        promptUsed: string;
        cost: {
            imageEditGeneration: number;
            total: number;
        };
        pipelineLog: string[];
    }>;
}
