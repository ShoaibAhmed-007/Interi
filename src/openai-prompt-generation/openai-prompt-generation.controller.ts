import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { OpenaiPromptGenerationService } from './openai-prompt-generation.service';
import { GetUser } from '../auth/decorator/get-user.decorator';

@ApiTags('openai-prompt-generation')
@Controller('openai-prompt-generation')
export class OpenaiPromptGenerationController {
  constructor(
    private readonly openaiPromptGenerationService: OpenaiPromptGenerationService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('get-picture-generation')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Generate a descriptive AI image prompt from a saved design',
    description:
      'Looks up the design by `designId`, verifies it belongs to the authenticated user, then uses GPT-4o-mini to generate a detailed image generation prompt from the design attributes. Requires a valid JWT token.',
  })
  @ApiQuery({
    name: 'designId',
    required: true,
    example: 'clx1abc...uuid...',
    description: 'The UUID of the design to generate a prompt for',
  })
  @ApiResponse({
    status: 200,
    description: 'Prompt generated successfully',
    schema: {
      example: {
        success: true,
        prompt:
          'A breathtaking modern living room bathed in warm afternoon sunlight...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  @ApiResponse({ status: 404, description: 'Design not found or does not belong to user' })
  @ApiResponse({ status: 500, description: 'Failed to generate prompt from OpenAI' })
  async getPictureGeneration(
    @GetUser('id') userId: string,
    @Query('designId') designId: string,
  ) {
    const prompt =
      await this.openaiPromptGenerationService.generatePromptFromDesign(
        designId,
        userId,
      );

    console.log(`[OpenAI Prompt] Generated for user ${userId}, design ${designId}:`);
    console.log(prompt);

    return {
      success: true,
      prompt,
    };
  }

  @Post('public-generate-prompt')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Generate a descriptive AI image prompt from a saved design and an uploaded image',
    description: 'Public endpoint that takes an image and a designId without JWT authentication.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        designId: { type: 'string', example: 'clx...uuid' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Prompt generated successfully along with cost metrics' })
  async publicGeneratePrompt(
    @Body('designId') designId: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!image) {
      throw new Error('Image file is required');
    }
    const result = await this.openaiPromptGenerationService.generatePromptWithImage(
      designId,
      image.buffer,
    );

    console.log(`\n--- Cost Summary (Prompt Only) ---`);
    console.log(`[gpt-4o-mini] Tokens: ${result.tokens.total} (in: ${result.tokens.input}, out: ${result.tokens.output}) | Cost: $${result.cost.toFixed(6)}`);
    console.log(`----------------------------------\n`);

    return {
      success: true,
      ...result,
    };
  }

  @Post('public-generate-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Generate an AI image directly from a saved design and an uploaded image',
    description: 'Public endpoint that creates the prompt and then generates an image using DALL-E 3.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        designId: { type: 'string', example: 'clx...uuid' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image generated successfully along with cost metrics' })
  async publicGenerateImage(
    @Body('designId') designId: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!image) {
      throw new Error('Image file is required');
    }
    const result = await this.openaiPromptGenerationService.generateImageWithImage(
      designId,
      image.buffer,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Post('public-generate-image-dto')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Generate an AI image directly from DTO parameters and an uploaded image',
    description: 'Public endpoint that takes design DTO parameters (style, colorPalette, location, category) and an image, without relying on a saved design ID.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        style: { type: 'string', example: 'Modern Minimalist' },
        colorPalette: { type: 'string', example: 'Warm earth tones' },
        location: { type: 'string', example: 'Living Room' },
        category: { type: 'string', example: 'Residential' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image generated successfully along with cost metrics' })
  async publicGenerateImageDto(
    @Body('style') style: string,
    @Body('colorPalette') colorPalette: string,
    @Body('location') location: string,
    @Body('category') category: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!image) {
      throw new Error('Image file is required');
    }
    const dto = { style, colorPalette, location, category };
    const result = await this.openaiPromptGenerationService.generateImageWithDto(
      dto,
      image.buffer,
    );
    return {
      success: true,
      ...result,
    };
  }

  @Post('public-advanced-edit')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Advanced image editing pipeline using Room Segmentation, MiDaS Depth Mapping, and Empty Floor Detection to generate decor masks.',
    description: 'Public endpoint that processes an uploaded image through a complex computer vision pipeline to generate masks, and then calls OpenAI Image Edit.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        designId: { type: 'string', example: 'clx...uuid' },
        prompt: { type: 'string', example: 'Add a modern velvet sofa on the floor', description: 'Describe what decor to add' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Final decor image generated successfully' })
  async publicAdvancedEdit(
    @Body('designId') designId: string,
    @Body('prompt') prompt: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!image) {
      throw new Error('Image file is required');
    }
    const result = await this.openaiPromptGenerationService.processAdvancedImageEdit(
      designId,
      image.buffer,
      prompt,
    );
    return {
      success: true,
      ...result,
    };
  }
}
