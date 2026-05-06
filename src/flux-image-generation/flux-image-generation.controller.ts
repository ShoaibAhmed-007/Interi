import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { FluxImageGenerationService } from './flux-image-generation.service';
import { ApplyStyleDto } from './dto/apply-style.dto';
import { GenerateFromS3Dto } from './dto/generate-from-s3.dto';

@ApiTags('flux-image-generation')
@Controller('flux-image-generation')
export class FluxImageGenerationController {
  constructor(private readonly fluxImageGenerationService: FluxImageGenerationService) {}

  @Post('flux-image-generation')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Generate an AI image via Flux Pro from an uploaded image',
    description: 'Generates an AI image for an existing Design entry (by designId). Uses the Design record (category, location, style, colorPalette and originalImageUrl) as input and stores the result in S3. Requires a valid JWT token.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        designId: { type: 'string', example: 'a1b2c3d4-uuid' },
      },
      required: ['designId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Image generated successfully via Flux' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  async getImage(
    @Body('designId') designId: string,
    @GetUser('id') userId: string,
  ) {
    if (!designId) {
      throw new BadRequestException('designId is required');
    }

    const result = await this.fluxImageGenerationService.generateImageForDesign(
      userId,
      designId,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post('apply-style')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Apply style from one S3 image to another (keep composition)',
    description:
      'Takes two S3 image keys and a `location` string. Requires a valid JWT. Checks credits, then applies the color palette and style of `sourceKey` to `targetKey` while preserving dimensions and key composition elements (windows/doors).',
  })
  @ApiBody({ type: ApplyStyleDto })
  @ApiResponse({ status: 200, description: 'Style transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or not enough credits' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  async applyStyle(
    @Body() dto: ApplyStyleDto,
    @GetUser('id') userId: string,
  ) {
    if (!dto || !dto.sourceKey || !dto.targetKey || !dto.location) {
      throw new BadRequestException('sourceKey, targetKey and location are required');
    }

    const result = await this.fluxImageGenerationService.transferStyleBetweenS3Keys(
      userId,
      dto.sourceKey,
      dto.targetKey,
      dto.location,
    );

    return { success: true, ...result };
  }

  @Post('generate-from-s3')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Generate an AI image from an S3 key using a custom prompt',
    description:
      'Takes an S3 key and a prompt string, checks user credits, submits the image to Flux, uploads the result to S3, deducts a credit, and returns URLs. Requires JWT.',
  })
  @ApiBody({ type: GenerateFromS3Dto })
  @ApiResponse({ status: 200, description: 'Image generated successfully via Flux' })
  @ApiResponse({ status: 400, description: 'Bad request or not enough credits' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  async generateFromS3(
    @Body() dto: GenerateFromS3Dto,
    @GetUser('id') userId: string,
  ) {
    if (!dto || !dto.s3Key || !dto.prompt) {
      throw new BadRequestException('s3Key and prompt are required');
    }

    const result = await this.fluxImageGenerationService.generateFromS3Key(userId, dto.s3Key, dto.prompt);

    return { success: true, ...result };
  }

  
}
