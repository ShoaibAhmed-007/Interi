import { Controller, Get, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AmazonS3Service } from './amazon-s3.service';

@ApiTags('S3')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('s3')
export class AmazonS3Controller {
  constructor(private readonly amazonS3Service: AmazonS3Service) {}

  /**
   * GET /s3/presigned-url?fileName=room.jpg&fileType=image/jpeg
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
  @ApiQuery({ name: 'fileName', required: true, example: 'room.jpg' })
  @ApiQuery({ name: 'fileType', required: true, example: 'image/jpeg' })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL generated successfully.',
    schema: {
      example: {
        uploadUrl: 'https://swiftnine-apps.s3.eu-north-1.amazonaws.com/uploads/<uuid>.jpg?X-Amz-...',
        publicUrl: 'https://swiftnine-apps.s3.eu-north-1.amazonaws.com/uploads/<uuid>.jpg',
        s3Key: 'uploads/<uuid>.jpg',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing or invalid query parameters.' })
  async getPresignedUrl(
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: string,
  ) {
    if (!fileName || !fileType) {
      throw new BadRequestException('Both "fileName" and "fileType" query parameters are required.');
    }

    const { uploadUrl, publicUrl, s3Key } = await this.amazonS3Service.generatePresignedUploadUrl(
      fileName,
      fileType,
    );

    return { uploadUrl, publicUrl, s3Key };
  }
}
