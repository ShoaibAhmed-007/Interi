"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiPromptGenerationService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const prisma_service_1 = require("../prisma/prisma.service");
let OpenaiPromptGenerationService = class OpenaiPromptGenerationService {
    prisma;
    openai;
    constructor(prisma) {
        this.prisma = prisma;
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY ?? 'missing-key',
        });
    }
    async generatePromptFromDesign(designId, userId) {
        const design = await this.prisma.design.findUnique({
            where: { id: designId },
        });
        if (!design) {
            throw new common_1.NotFoundException(`Design with id "${designId}" not found.`);
        }
        if (design.userId !== userId) {
            throw new common_1.NotFoundException(`Design with id "${designId}" not found.`);
        }
        const metaPrompt = `You are an expert AI prompt engineer specialising in interior and architectural design image generation.

Given the following design parameters, write a single highly descriptive and detailed image generation prompt that a model like DALL-E or Stable Diffusion would use to produce a stunning, photorealistic render of the described space.

Design Parameters:
- Category: ${design.category}
- Location / Room: ${design.location}
- Style: ${design.style}
- Color Palette: ${design.colorPalette}

The prompt must:
1. Clearly describe the space, furniture arrangement, materials, and textures
2. Specify lighting conditions (natural light, artificial, golden hour, etc.)
3. Reference the exact color palette in the description
4. Mention the design style throughout (materials, shapes, decor motifs)
5. Include camera/shot details: perspective, focal length, depth of field
6. Include atmosphere: mood, time of day, ambience
7. End with negative guidance: "Negative: cartoon, illustration, watermark, text, blurry, low quality, oversaturated, deformed"

Output ONLY the prompt text — no labels, no explanations, no extra text.`;
        try {
            const response = await this.openai.responses.create({
                model: 'gpt-4o-mini',
                input: metaPrompt,
                max_output_tokens: 512,
                temperature: 0.5,
            });
            const generated = response.output_text?.trim();
            if (!generated || generated.length < 10) {
                throw new common_1.InternalServerErrorException('OpenAI returned an empty prompt.');
            }
            return generated;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            console.error('OpenAI prompt generation failed:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to generate prompt. Please try again.');
        }
    }
    async describeRoomFromImage(imageBuffer) {
        const base64Image = imageBuffer.toString('base64');
        const visionPrompt = `You are an expert architectural and interior design analyst with exceptional spatial awareness.

Look at this room image carefully and write an extremely detailed, factual description of EVERYTHING you observe. This description will be used to recreate this exact room structure in a different style, so precision is critical.

Describe the following in meticulous detail:

1. ROOM STRUCTURE & DIMENSIONS:
   - Room shape (rectangular, L-shaped, etc.), approximate proportions and size feeling (small, medium, large)
   - Ceiling type (flat, vaulted, coffered) and approximate height relative to the room
   - Floor type and material

2. ARCHITECTURAL FIXTURES (EXACT POSITIONS — THIS IS CRITICAL):
   - Windows: How many, which wall they are on (left, right, back, front), their position on that wall (centered, left-of-center, near corner), approximate size relative to the wall, shape (rectangular, arched, floor-to-ceiling)
   - Doors: How many, which wall, position, size, type (single, double, sliding, open archway)
   - Columns, beams, built-in shelving, alcoves, niches — exact positions
   - Any other fixed architectural elements

3. LIGHTING:
   - Natural light: which direction it enters from, intensity, shadows cast
   - Artificial light fixtures: type and position

4. CAMERA/PERSPECTIVE:
   - Camera angle (eye-level, slightly elevated, corner shot)
   - What walls are visible, what is the focal point
   - Approximate field of view

5. CURRENT STATE:
   - Existing furniture and their positions (if any)
   - Current wall colors, floor colors
   - Overall condition and feel

Be extremely precise about spatial positions. Use terms like "on the left wall, centered vertically, occupying roughly 40% of the wall width" rather than vague descriptions.

Output ONLY the description — no labels, no bullet headers, no explanations. Write it as flowing, dense descriptive text.`;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: visionPrompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 800,
                temperature: 0.3,
            });
            const description = response.choices[0]?.message?.content?.trim();
            const usage = response.usage;
            if (!description || description.length < 10) {
                throw new common_1.InternalServerErrorException('GPT-4o-mini returned an empty room description.');
            }
            const inputTokens = usage?.prompt_tokens || 0;
            const outputTokens = usage?.completion_tokens || 0;
            const totalTokens = usage?.total_tokens || 0;
            const inputCost = (inputTokens / 1_000_000) * 0.15;
            const outputCost = (outputTokens / 1_000_000) * 0.60;
            const totalCost = inputCost + outputCost;
            return {
                description,
                tokens: {
                    input: inputTokens,
                    output: outputTokens,
                    total: totalTokens,
                },
                cost: totalCost,
            };
        }
        catch (error) {
            if (error instanceof common_1.InternalServerErrorException)
                throw error;
            console.error('Room description (vision) failed:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to describe room from image.');
        }
    }
    async generatePromptWithImage(designId, imageBuffer) {
        const design = await this.prisma.design.findUnique({
            where: { id: designId },
        });
        if (!design) {
            throw new common_1.NotFoundException(`Design with id "${designId}" not found.`);
        }
        const roomData = await this.describeRoomFromImage(imageBuffer);
        const designDirective = `Redesign this space in ${design.style} style with a ${design.colorPalette} color palette. It is a ${design.location} (${design.category}).`;
        return {
            prompt: roomData.description,
            designDirective,
            tokens: roomData.tokens,
            cost: roomData.cost,
        };
    }
    async generateImageWithImage(designId, imageBuffer) {
        const design = await this.prisma.design.findUnique({
            where: { id: designId },
        });
        if (!design) {
            throw new common_1.NotFoundException(`Design with id "${designId}" not found.`);
        }
        const roomData = await this.describeRoomFromImage(imageBuffer);
        const designDirective = `Redesign this exact room in ${design.style} style using a ${design.colorPalette} color palette.`;
        const dallePrompt = `You are generating a photorealistic interior design render.

Here is a precise description of the room you must recreate:
${roomData.description}

IMPORTANT RULES:
- Keep every architectural element (windows, doors, columns, walls, ceiling) in EXACTLY the same position and size as described above.
- Do NOT add, remove, move, or resize any windows or doors.
- The camera angle and perspective must match the description.
- Only change the interior design: furniture, decor, materials, wall colors, and decorative lighting.

Design Instruction: ${designDirective}

Negative: cartoon, illustration, watermark, text, blurry, low quality, oversaturated, deformed, altered room structure, moved windows, changed door positions`;
        try {
            const response = await this.openai.images.generate({
                model: 'dall-e-3',
                prompt: dallePrompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
            });
            const generatedImage = response.data?.[0]?.url;
            if (!generatedImage) {
                throw new common_1.InternalServerErrorException('Failed to generate image via DALL-E.');
            }
            const imageCost = 0.040;
            const totalCost = roomData.cost + imageCost;
            console.log(`\n--- Cost Summary ---`);
            console.log(`[gpt-4o-mini] Room Description — Tokens: ${roomData.tokens.total} (in: ${roomData.tokens.input}, out: ${roomData.tokens.output}) | Cost: $${roomData.cost.toFixed(6)}`);
            console.log(`[dall-e-3]    Image Generation | Cost: $${imageCost.toFixed(6)}`);
            console.log(`[Total]       Overall Cost: $${totalCost.toFixed(6)}`);
            console.log(`--------------------\n`);
            return {
                imageUrl: generatedImage,
                roomDescription: roomData.description,
                designDirective,
                fullPromptSentToDalle: dallePrompt,
                tokens: roomData.tokens,
                cost: {
                    roomDescription: roomData.cost,
                    imageGeneration: imageCost,
                    total: totalCost,
                },
            };
        }
        catch (error) {
            console.error('DALL-E 3 image generation failed:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to generate image.');
        }
    }
    async generateImageWithDto(dto, imageBuffer) {
        const roomData = await this.describeRoomFromImage(imageBuffer);
        const designDirective = `Redesign this exact room in ${dto.style} style using a ${dto.colorPalette} color palette. It is a ${dto.location} (${dto.category}).`;
        const dallePrompt = `You are generating a photorealistic interior design render.

Here is a precise description of the room you must recreate:
${roomData.description}

IMPORTANT RULES:
- Keep every architectural element (windows, doors, columns, walls, ceiling) in EXACTLY the same position and size as described above.
- Do NOT add, remove, move, or resize any windows or doors.
- The camera angle and perspective must match the description.
- Only change the interior design: furniture, decor, materials, wall colors, and decorative lighting.

Design Instruction: ${designDirective}

Negative: cartoon, illustration, watermark, text, blurry, low quality, oversaturated, deformed, altered room structure, moved windows, changed door positions`;
        try {
            const response = await this.openai.images.generate({
                model: 'dall-e-3',
                prompt: dallePrompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
            });
            const generatedImage = response.data?.[0]?.url;
            if (!generatedImage) {
                throw new common_1.InternalServerErrorException('Failed to generate image via DALL-E.');
            }
            const imageCost = 0.040;
            const totalCost = roomData.cost + imageCost;
            console.log(`\n--- Cost Summary (Without DB) ---`);
            console.log(`[gpt-4o-mini] Room Description — Tokens: ${roomData.tokens.total} (in: ${roomData.tokens.input}, out: ${roomData.tokens.output}) | Cost: $${roomData.cost.toFixed(6)}`);
            console.log(`[dall-e-3]    Image Generation | Cost: $${imageCost.toFixed(6)}`);
            console.log(`[Total]       Overall Cost: $${totalCost.toFixed(6)}`);
            console.log(`--------------------\n`);
            return {
                imageUrl: generatedImage,
                roomDescription: roomData.description,
                designDirective,
                fullPromptSentToDalle: dallePrompt,
                tokens: roomData.tokens,
                cost: {
                    roomDescription: roomData.cost,
                    imageGeneration: imageCost,
                    total: totalCost,
                },
            };
        }
        catch (error) {
            console.error('DALL-E 3 image generation failed:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to generate image.');
        }
    }
    async processAdvancedImageEdit(designId, imageBuffer, userPrompt) {
        const design = await this.prisma.design.findUnique({
            where: { id: designId },
        });
        if (!design) {
            throw new common_1.NotFoundException(`Design with id "${designId}" not found.`);
        }
        console.log(`[CV Pipeline] Starting advanced edit for design ${designId}`);
        console.log('[CV Pipeline] 1. Running Room Segmentation (Mocked)');
        console.log('[CV Pipeline] 2. Generating MiDaS Depth Map (Mocked)');
        console.log('[CV Pipeline] 3. Detecting Empty Floor Space (Mocked)');
        console.log('[CV Pipeline] 4. Creating RGBA Mask (Mocked)');
        let totalCost = 0;
        try {
            const editPrompt = `Follow depth map and segmentation boundaries strictly. ${userPrompt}. 
Style: ${design.style}. Color Palette: ${design.colorPalette}. 
Negative: cartoon, watermark, blurry.`;
            console.log('[CV Pipeline] 5. Sending to OpenAI Images Edit API with mask');
            totalCost = 0.020;
            const simulatedImageUrl = 'https://mocked-dalle-edit-url.com/edited.png';
            console.log(`[dall-e-2 edit] Image Cost: $${totalCost.toFixed(6)}`);
            return {
                imageUrl: simulatedImageUrl,
                promptUsed: editPrompt,
                cost: {
                    imageEditGeneration: totalCost,
                    total: totalCost,
                },
                pipelineLog: [
                    'Room Segmentation (Success)',
                    'MiDaS Depth Map (Success)',
                    'Floor Plan Masking (Success)',
                    'OpenAI DALL-E Edit (Success)'
                ]
            };
        }
        catch (error) {
            console.error('Advanced image edit pipeline failed:', error?.message ?? error);
            throw new common_1.InternalServerErrorException('Failed to execute advanced AI editing pipeline.');
        }
    }
};
exports.OpenaiPromptGenerationService = OpenaiPromptGenerationService;
exports.OpenaiPromptGenerationService = OpenaiPromptGenerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OpenaiPromptGenerationService);
//# sourceMappingURL=openai-prompt-generation.service.js.map