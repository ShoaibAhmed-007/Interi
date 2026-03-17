import { Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FluxImageGenerationService } from './flux-image-generation.service';

@ApiTags('flux-image-generation')
@Controller('flux-image-generation')
export class FluxImageGenerationController {
  constructor(private readonly fluxImageGenerationService: FluxImageGenerationService) {}

  @Post('flux-image-generation')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Generate an AI image via Flux Pro from an uploaded image',
    description: 'Takes a design DTO (category, location, style, colorPalette) + an image to run an image-to-image job on Flux. Requires a valid JWT token.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', example: 'interior' },
        location: { type: 'string', example: 'office' },
        style: { type: 'string', example: 'modern' },
        colorPalette: { type: 'string', example: 'decent colour pattern' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['category', 'location', 'style', 'colorPalette', 'image'],
    },
  })
  @ApiResponse({ status: 200, description: 'Image generated successfully via Flux' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid or missing JWT' })
  async getImage(
    @Body('category') category: string,
    @Body('location') location: string,
    @Body('style') style: string,
    @Body('colorPalette') colorPalette: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('Image file is required');
    }

    if (!category || !location || !style || !colorPalette) {
       throw new BadRequestException('category, location, style, and colorPalette are all required.');
    }

    const dto = { category, location, style, colorPalette };
    const result = await this.fluxImageGenerationService.generateImage(dto, image.buffer);

    return {
      success: true,
      ...result,
    };
  }
}
