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
        const originalKeyOrUrl = d.originalImageUrl || null;
        const resultKeyOrUrl = d.resultImageUrl || null;

        let originalUrl: string | null = originalKeyOrUrl;
        let resultUrl: string | null = resultKeyOrUrl;

        try {
          if (originalKeyOrUrl && !originalKeyOrUrl.startsWith('http')) {
            originalUrl = await this.s3.generatePresignedDownloadUrl(originalKeyOrUrl);
          }
        } catch (e) {
          console.warn('[DesignHistory] Failed to generate presigned URL for original image', { designId: d.id, err: e?.message ?? e });
        }

        try {
          if (resultKeyOrUrl && !resultKeyOrUrl.startsWith('http')) {
            resultUrl = await this.s3.generatePresignedDownloadUrl(resultKeyOrUrl);
          }
        } catch (e) {
          console.warn('[DesignHistory] Failed to generate presigned URL for result image', { designId: d.id, err: e?.message ?? e });
        }

        return {
          id: d.id,
          createdAt: d.createdAt,
          originalImageKey: originalKeyOrUrl,
          originalImageUrl: originalUrl,
          resultImageKey: resultKeyOrUrl,
          resultImageUrl: resultUrl,
        };
      }),
    );

    return mapped;
  }
}
