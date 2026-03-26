import { BadRequestException, Injectable } from '@nestjs/common';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';

@Injectable()
export class PublicTestingUploadService {
  constructor(private readonly s3: AmazonS3Service) {}

  async uploadForTesting(file: Express.Multer.File, fileType: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const normalizedFileType = (fileType || file.mimetype || '').trim().toLowerCase();
    if (!normalizedFileType) {
      throw new BadRequestException('fileType is required');
    }

    const extension = this.getExtensionFromMime(normalizedFileType);
    const uploaded = await this.s3.uploadBuffer(file.buffer, extension, normalizedFileType);
    const accessibleUrl = await this.s3.generatePresignedDownloadUrl(uploaded.s3Key, 60 * 60 * 24 * 7);

    return {
      success: true,
      s3Key: uploaded.s3Key,
      publicUrl: accessibleUrl,
      rawPublicUrl: uploaded.publicUrl,
    };
  }

  private getExtensionFromMime(fileType: string): string {
    const mime = fileType.split('/')[1] || 'bin';

    if (mime.includes('jpeg')) return 'jpg';
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';

    return mime.replace(/[^a-z0-9]/gi, '') || 'bin';
  }
}
