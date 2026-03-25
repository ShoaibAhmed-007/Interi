import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';

@Injectable()
export class DesignHistoryService {
  constructor(private prisma: PrismaService, private s3: AmazonS3Service) {}

  async getUserDesignHistory(userId: string) {
    const designs = await this.prisma.design.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = await Promise.all(
      designs.map(async (d) => {
        let originalUrl = d.originalImageUrl || null;
        let resultUrl = d.resultImageUrl || null;

        try {
          if (originalUrl && !originalUrl.startsWith('http')) {
            originalUrl = await this.s3.generatePresignedDownloadUrl(originalUrl);
          }
        } catch (e) {
          console.warn('[DesignHistory] Failed to generate presigned URL for original image', { designId: d.id, err: e?.message ?? e });
        }

        try {
          if (resultUrl && !resultUrl.startsWith('http')) {
            resultUrl = await this.s3.generatePresignedDownloadUrl(resultUrl);
          }
        } catch (e) {
          console.warn('[DesignHistory] Failed to generate presigned URL for result image', { designId: d.id, err: e?.message ?? e });
        }

        return {
          id: d.id,
          createdAt: d.createdAt,
          originalImageUrl: originalUrl,
          resultImageUrl: resultUrl,
        };
      }),
    );

    return mapped;
  }
}
