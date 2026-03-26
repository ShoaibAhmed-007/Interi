import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';

@Injectable()
export class DesignHistoryService {
  constructor(private prisma: PrismaService, private s3: AmazonS3Service) {}

  async getUserDesignHistory(userId: string) {
    if (!userId) {
      throw new BadRequestException('Authenticated user id is required');
    }

    const historyRows = await this.prisma.designHistory.findMany({
      where: {
        userId,
        design: {
          userId,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const mapped = await Promise.all(
      historyRows.map(async (h) => {
        const originalKeyOrUrl = h.originalImageKey || null;
        const resultKeyOrUrl = h.resultImageKey || null;

        let originalUrl: string | null = originalKeyOrUrl;
        let resultUrl: string | null = resultKeyOrUrl;

        try {
          if (originalKeyOrUrl && !originalKeyOrUrl.startsWith('http')) {
            originalUrl = await this.s3.generatePresignedDownloadUrl(originalKeyOrUrl);
          }
        } catch (e) {
          console.warn('[DesignHistory] Failed to generate presigned URL for original image', { historyId: h.id, designId: h.designId, err: e?.message ?? e });
        }

        try {
          if (resultKeyOrUrl && !resultKeyOrUrl.startsWith('http')) {
            resultUrl = await this.s3.generatePresignedDownloadUrl(resultKeyOrUrl);
          }
        } catch (e) {
          console.warn('[DesignHistory] Failed to generate presigned URL for result image', { historyId: h.id, designId: h.designId, err: e?.message ?? e });
        }

        return {
          id: h.id,
          userId: h.userId,
          designId: h.designId,
          createdAt: h.createdAt,
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
