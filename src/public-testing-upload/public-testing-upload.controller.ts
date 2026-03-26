import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicTestingUploadService } from './public-testing-upload.service';
import { UploadTestFileDto } from './dto/upload-test-file.dto';

@ApiTags('public-testing-upload')
@Controller('public-testing-upload')
export class PublicTestingUploadController {
  constructor(private readonly publicTestingUploadService: PublicTestingUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Public testing upload to S3 (JWT bypassed)',
    description:
      'Testing endpoint that accepts file + fileType, uploads to S3 via backend, and returns s3Key.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload payload for testing S3 upload.',
    schema: {
      type: 'object',
      properties: {
        fileType: {
          type: 'string',
          example: 'image/jpeg',
          description: 'MIME type of the file.',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Binary file payload.',
        },
      },
      required: ['fileType', 'file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully to S3.',
    schema: {
      example: {
        success: true,
        s3Key: 'interior-app/8f6f7f9d-2f5d-4e7d-8f08-b63f2dc7ad8f.jpg',
        publicUrl: 'https://bucket-name.s3.region.amazonaws.com/interior-app/8f6f7f9d-2f5d-4e7d-8f08-b63f2dc7ad8f.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...',
        rawPublicUrl: 'https://bucket-name.s3.region.amazonaws.com/interior-app/8f6f7f9d-2f5d-4e7d-8f08-b63f2dc7ad8f.jpg',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing file or fileType.' })
  async uploadTestFile(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadTestFileDto) {
    return this.publicTestingUploadService.uploadForTesting(file, dto.fileType);
  }
}
