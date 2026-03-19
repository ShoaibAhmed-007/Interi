import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AmazonS3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('AWS_REGION');
    this.bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Generates a pre-signed S3 PUT URL that allows the client to upload
   * a file directly to S3 without going through the server.
   *
   * @param fileName  - Original file name from the client (e.g. "room.jpg")
   * @param fileType  - MIME type of the file (e.g. "image/jpeg")
   * @param expiresIn - URL validity in seconds (default: 300 = 5 min)
   * @returns { uploadUrl, publicUrl, s3Key }
   */
  async generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    expiresIn = 300,
  ): Promise<{ uploadUrl: string; publicUrl: string; s3Key: string }> {
    // Append a UUID to the original filename so uploads never overwrite each other
    const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
    const uniqueKey = fileExtension
      ? `uploads/${uuidv4()}.${fileExtension}`
      : `uploads/${uuidv4()}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueKey,
      ContentType: fileType,
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      // Public URL where the file will be permanently accessible after upload
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${uniqueKey}`;

      return { uploadUrl, publicUrl, s3Key: uniqueKey };
    } catch (error) {
      console.error('[AmazonS3Service] Failed to generate pre-signed URL:', error?.message ?? error);
      throw new InternalServerErrorException('Failed to generate S3 pre-signed URL.');
    }
  }
}
