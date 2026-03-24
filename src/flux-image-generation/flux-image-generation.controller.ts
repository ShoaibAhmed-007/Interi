import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FluxImageGenerationService } from './flux-image-generation.service';

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
  ) {
    if (!designId) {
      throw new BadRequestException('designId is required');
    }

    const result = await this.fluxImageGenerationService.generateImageForDesign(designId);

    return {
      success: true,
      ...result,
    };
  }
}
