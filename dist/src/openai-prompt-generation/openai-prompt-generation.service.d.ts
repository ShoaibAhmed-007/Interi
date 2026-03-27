import { PrismaService } from '../prisma/prisma.service';
export declare class OpenaiPromptGenerationService {
    private prisma;
    private openai;
    constructor(prisma: PrismaService);
    generatePromptFromDesign(designId: string, userId: string): Promise<string>;
    describeRoomFromImage(imageBuffer: Buffer): unknown;
    generatePromptWithImage(designId: string, imageBuffer: Buffer): unknown;
    generateImageWithImage(designId: string, imageBuffer: Buffer): unknown;
    generateImageWithDto(dto: {
        style: string;
        colorPalette: string;
        location: string;
        category: string;
    }, imageBuffer: Buffer): unknown;
    processAdvancedImageEdit(designId: string, imageBuffer: Buffer, userPrompt: string): unknown;
}
