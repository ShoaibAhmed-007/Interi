import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AmazonS3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly defaultDownloadExpiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('AWS_REGION');
    this.bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const configuredDownloadExpiresIn = Number(
      this.configService.get<string>('AWS_S3_PRESIGNED_GET_EXPIRES_IN'),
    );
    this.defaultDownloadExpiresIn =
      Number.isFinite(configuredDownloadExpiresIn) &&
      configuredDownloadExpiresIn > 0
        ? configuredDownloadExpiresIn
        : 86400;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  /**
   * Generates a pre-signed S3 PUT URL that allows the client to upload
   * a file directly to S3 without going through the server.
   *
   * @param fileType  - MIME type of the file (e.g. "image/jpeg")
   * @param expiresIn - URL validity in seconds (default: 300 = 5 min)
   * @returns { uploadUrl, publicUrl, s3Key }
   */
  async generatePresignedUploadUrl(
    fileType: string,
    expiresIn = 300,
  ): Promise<{ uploadUrl: string; publicUrl: string; s3Key: string }> {
    // Determine file extension from MIME type
    let fileExtension = '';
    if (fileType) {
      const mime = fileType.split('/')[1];
      if (mime) {
        if (mime.includes('jpeg')) fileExtension = 'jpg';
        else if (mime.includes('png')) fileExtension = 'png';
        else if (mime.includes('webp')) fileExtension = 'webp';
        else fileExtension = mime.replace(/[^a-z0-9]/gi, '') || 'bin';
      }
    }

    const uniqueKey = fileExtension
      ? `interior-app/${uuidv4()}.${fileExtension}`
      : `interior-app/${uuidv4()}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueKey,
      ContentType: fileType,
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      // Public URL where the file will be permanently accessible after upload
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${uniqueKey}`;

      return { uploadUrl, publicUrl, s3Key: uniqueKey };
    } catch (error) {
      console.error(
        '[AmazonS3Service] Failed to generate pre-signed URL:',
        error instanceof Error ? error.message : error,
      );
      throw new InternalServerErrorException(
        'Failed to generate S3 pre-signed URL.',
      );
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    fileExtension = 'jpg',
    contentType = 'image/jpeg',
  ): Promise<{ publicUrl: string; s3Key: string }> {
    const uniqueKey = `interior-app/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueKey,
      Body: buffer,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${uniqueKey}`;
      return { publicUrl, s3Key: uniqueKey };
    } catch (error) {
      console.error(
        '[AmazonS3Service] Failed to upload buffer to S3:',
        error instanceof Error ? error.message : error,
      );
      throw new InternalServerErrorException('Failed to upload file to S3.');
    }
  }

  /**
   * Download an object from S3 and return its buffer and content-type.
   * @param s3Key Key of the object in the bucket (e.g. 'interior-app/...jpg')
   */
  async downloadBuffer(
    s3Key: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });
    try {
      const response = await this.s3Client.send(command);
      const stream = response.Body as any;

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      const contentType =
        (response.ContentType as string) || 'application/octet-stream';
      return { buffer, contentType };
    } catch (error) {
      console.error(
        '[AmazonS3Service] Failed to download object from S3:',
        error instanceof Error ? error.message : error,
      );
      throw new InternalServerErrorException(
        'Failed to download file from S3.',
      );
    }
  }

  /**
   * Generate a presigned GET URL for a stored object so clients can download/view it.
   * @param s3Key Key of the object in the bucket (e.g. 'interior-app/...jpg')
   * @param expiresIn Seconds until the signed URL expires (defaults to .env AWS_S3_PRESIGNED_GET_EXPIRES_IN or 86400)
   */
  async generatePresignedDownloadUrl(
    s3Key: string,
    expiresIn?: number,
  ): Promise<string> {
    const resolvedExpiresIn = expiresIn ?? this.defaultDownloadExpiresIn;
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });
    try {
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: resolvedExpiresIn,
      });
      return url;
    } catch (error) {
      console.error(
        '[AmazonS3Service] Failed to generate presigned GET URL:',
        error instanceof Error ? error.message : error,
      );
      throw new InternalServerErrorException(
        'Failed to generate presigned download URL.',
      );
    }
  }

  /**
   * Generate a presigned PUT (upload) URL for an existing key.
   * Useful when you want clients to re-upload or replace an existing object.
   */
  async generatePresignedUploadUrlForKey(
    s3Key: string,
    fileType: string,
    expiresIn = 300,
  ): Promise<{ uploadUrl: string; publicUrl: string; s3Key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: fileType,
    });
    try {
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      return { uploadUrl, publicUrl, s3Key };
    } catch (error) {
      console.error(
        '[AmazonS3Service] Failed to generate presigned upload URL for key:',
        error instanceof Error ? error.message : error,
      );
      throw new InternalServerErrorException(
        'Failed to generate presigned upload URL for existing key.',
      );
    }
  }
}
