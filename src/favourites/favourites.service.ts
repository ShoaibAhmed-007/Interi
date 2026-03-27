import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';

@Injectable()
export class FavouritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: AmazonS3Service,
  ) {}

  /**
   * Get all favourited designs for a user.
   * Returns design metadata + presigned download URLs for original & result images.
   */
  async getUserFavourites(userId: string) {
    const favourites = await this.prisma.favourite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        design: true,
      },
    });

    // Build response with presigned URLs for each design
    const results = await Promise.all(
      favourites.map(async (fav) => {
        const design = fav.design;

        // Generate presigned download URL for original image (S3 key)
        let originalPresignedUrl: string | null = null;
        let originalPublicUrl: string | null = null;
        let originalS3Key: string | null = null;

        if (design.originalImageUrl) {
          const key = design.originalImageUrl;
          originalS3Key = key;
          try {
            originalPresignedUrl =
              await this.s3.generatePresignedDownloadUrl(key);
            originalPublicUrl = this.buildPublicUrl(key);
          } catch {
            originalPresignedUrl = null;
          }
        }

        // Generate presigned download URL for result image (S3 key)
        let resultPresignedUrl: string | null = null;
        let resultPublicUrl: string | null = null;
        let resultS3Key: string | null = null;

        if (design.resultImageUrl) {
          const key = design.resultImageUrl;
          resultS3Key = key;
          try {
            resultPresignedUrl =
              await this.s3.generatePresignedDownloadUrl(key);
            resultPublicUrl = this.buildPublicUrl(key);
          } catch {
            resultPresignedUrl = null;
          }
        }

        return {
          favouriteId: fav.id,
          designId: design.id,
          createdAt: design.createdAt,
          original: {
            s3Key: originalS3Key,
            publicUrl: originalPublicUrl,
            presignedUrl: originalPresignedUrl,
          },
          result: {
            s3Key: resultS3Key,
            publicUrl: resultPublicUrl,
            presignedUrl: resultPresignedUrl,
          },
        };
      }),
    );

    return results;
  }

  /**
   * Add a design to the user's favourites.
   */
  async addFavourite(userId: string, designId: string) {
    // Verify the design exists
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
    });
    if (!design) {
      throw new NotFoundException(`Design with ID "${designId}" not found`);
    }

    // Check for duplicates
    const existing = await this.prisma.favourite.findUnique({
      where: { userId_designId: { userId, designId } },
    });
    if (existing) {
      throw new ConflictException('Design is already in favourites');
    }

    const favourite = await this.prisma.favourite.create({
      data: { userId, designId },
    });

    return { message: 'Design added to favourites', favouriteId: favourite.id };
  }

  /**
   * Remove a design from the user's favourites.
   */
  async removeFavourite(userId: string, designId: string) {
    const existing = await this.prisma.favourite.findUnique({
      where: { userId_designId: { userId, designId } },
    });
    if (!existing) {
      throw new NotFoundException('Favourite not found');
    }

    await this.prisma.favourite.delete({
      where: { userId_designId: { userId, designId } },
    });

    return { message: 'Design removed from favourites' };
  }

  /** Helper to build a public S3 URL from a key */
  private buildPublicUrl(s3Key: string): string {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
  }
}
