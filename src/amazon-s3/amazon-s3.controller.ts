import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AmazonS3Service } from './amazon-s3.service';

@ApiTags('S3')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('s3')
export class AmazonS3Controller {
  constructor(private readonly amazonS3Service: AmazonS3Service) {}

  /**
   * GET /s3/presigned-url?fileType=image/jpeg (optional: fileName=room.jpg)
   *
   * Returns a short-lived S3 pre-signed upload URL and the permanent
   * public URL where the file will live after the client PUTs to S3.
   */
  @Get('presigned-url')
  @ApiOperation({
    summary: 'Get a pre-signed S3 upload URL',
    description:
      'Returns a temporary uploadUrl (PUT to this from your client) and the permanent publicUrl where the image will be accessible after upload.',
  })
  @ApiQuery({ name: 'fileType', required: true, example: 'image/jpeg' })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL generated successfully.',
    schema: {
      example: {
        uploadUrl:
          'https://swiftnine-apps.s3.eu-north-1.amazonaws.com/interior-app/<uuid>.jpg?X-Amz-...',
        publicUrl:
          'https://swiftnine-apps.s3.eu-north-1.amazonaws.com/interior-app/<uuid>.jpg',
        s3Key: 'interior-app/<uuid>.jpg',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid query parameters.',
  })
  async getPresignedUrl(@Query('fileType') fileType: string) {
    if (!fileType) {
      throw new BadRequestException('Query parameter "fileType" is required.');
    }

    const { uploadUrl, publicUrl, s3Key } =
      await this.amazonS3Service.generatePresignedUploadUrl(fileType);

    return { uploadUrl, publicUrl, s3Key };
  }

  @Get('presigned-download-url')
  @ApiOperation({
    summary: 'Get a pre-signed S3 download URL by key',
    description:
      'Returns a temporary signed GET URL for the provided s3Key. Uses AWS bucket/region/credentials from .env and defaults expiry from AWS_S3_PRESIGNED_GET_EXPIRES_IN or 86400 seconds.',
  })
  @ApiQuery({
    name: 's3Key',
    required: true,
    example: 'interior-app/example.jpg',
  })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    example: 86400,
    description:
      'Optional expiration in seconds. If omitted, default from .env is used.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed download URL generated successfully.',
    schema: {
      example: {
        presignedUrl:
          'https://swiftnine-apps.s3.eu-north-1.amazonaws.com/interior-app/example.jpg?X-Amz-...',
        s3Key: 'interior-app/example.jpg',
        expiresIn: 86400,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid query parameters.',
  })
  async getPresignedDownloadUrl(
    @Query('s3Key') s3Key: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const normalizedKey = s3Key?.trim();
    if (!normalizedKey) {
      throw new BadRequestException('Query parameter "s3Key" is required.');
    }

    let parsedExpiresIn: number | undefined;
    if (expiresIn) {
      const parsedValue = Number(expiresIn);
      if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        throw new BadRequestException(
          'Query parameter "expiresIn" must be a positive number.',
        );
      }
      parsedExpiresIn = parsedValue;
    }

    const presignedUrl =
      await this.amazonS3Service.generatePresignedDownloadUrl(
        normalizedKey,
        parsedExpiresIn,
      );

    const response: {
      presignedUrl: string;
      s3Key: string;
      expiresIn?: number;
    } = {
      presignedUrl,
      s3Key: normalizedKey,
    };

    if (parsedExpiresIn) {
      response.expiresIn = parsedExpiresIn;
    }

    return response;
  }
}
