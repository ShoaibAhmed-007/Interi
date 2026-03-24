import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FluxImageGenerationService {
  constructor(private prisma: PrismaService, private s3: AmazonS3Service) {}

  async generateImageForDesign(designId: string) {
    const design = await this.prisma.design.findUnique({ where: { id: designId } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }

    const dto = {
      category: design.category,
      location: design.location,
      style: design.style,
      colorPalette: design.colorPalette,
    };

    // Download original image referenced by design.originalImageUrl
    if (!design.originalImageUrl) {
      throw new InternalServerErrorException('Design does not have an originalImageUrl');
    }

    const apiKey = process.env.BFL_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('MISSING_API_KEY: BFL_API_KEY is not defined in .env');
    }

    try {
      const originalResp = await fetch(design.originalImageUrl);
      if (!originalResp.ok) {
        throw new Error('Failed to download original image');
      }
      const originalBuffer = Buffer.from(await originalResp.arrayBuffer());

      // Build prompt and force 1 megapixel output (~1024x1024)
      const prompt = `Please generate an edited version of the provided image.
Output must be exactly one megapixel or smaller (approximately 1024x1024 pixels).
Maintain important scene elements and proportions.

Setting:
${dto.category}
${dto.location}
${dto.style}
${dto.colorPalette}`;

      // Submit job to Flux / BFL API and request size ~1024x1024
      const submitResponse = await fetch('https://api.bfl.ml/v1/flux-pro-1.0-image-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Key': apiKey,
        },
        body: JSON.stringify({
          prompt,
          image: `data:image/jpeg;base64,${originalBuffer.toString('base64')}`,
          prompt_upsampling: false,
          strength: 0.8,
          // Requesting size; API may ignore, but include to constrain to ~1MP
          size: '1024x1024',
        }),
      });

      if (!submitResponse.ok) {
        const errDetails = await submitResponse.text();
        throw new Error(`BFL Job Submission Failed: ${submitResponse.status} - ${errDetails}`);
      }

      const submitData = await submitResponse.json();
      const jobId = submitData.id;

      // Poll for result
      let generatedImageUrl = null;
      let attempt = 0;
      const maxAttempts = 60; // longer polling

      while (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempt++;

        const pollResponse = await fetch(`https://api.bfl.ml/v1/get_result?id=${jobId}`, {
          method: 'GET',
          headers: { 'X-Key': apiKey },
        });

        if (!pollResponse.ok) continue;

        const pollData = await pollResponse.json();
        const status = pollData.status;
        if (status === 'Ready') {
          generatedImageUrl = pollData.result.sample;
          break;
        } else if (status === 'Failed' || status === 'Error') {
          throw new Error(`BFL Job Failed with status: ${status}`);
        }
      }

      if (!generatedImageUrl) throw new Error('BFL API Polling timed out');

      // Download generated image
      const genResp = await fetch(generatedImageUrl);
      if (!genResp.ok) throw new Error('Failed to download generated image');
      const genBuffer = Buffer.from(await genResp.arrayBuffer());

      // Upload to S3 interior-app/ folder
      const upload = await this.s3.uploadBuffer(genBuffer, 'jpg', genResp.headers.get('content-type') || 'image/jpeg');

      return {
        imageUrl: upload.publicUrl,
        promptUsed: prompt,
        s3Key: upload.s3Key,
      };
    } catch (error) {
      console.error('Flux Pro generation failed:', error?.message ?? error);
      throw new InternalServerErrorException('Failed to generate image via Flux.');
    }
  }

  /**
   * Check and consume credits for a user before generating an image.
   * Priority: use freeTrialsLeft if available, otherwise consume from an active subscription.
   * Throws BadRequestException if no credits are available.
   */
  async checkForCredits(userId: string) {
    const now = new Date();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // If user has free trials remaining, decrement and allow
    if (user.freeTrialsLeft && user.freeTrialsLeft > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { freeTrialsLeft: { decrement: 1 } as unknown as Prisma.IntFieldUpdateOperationsInput },
      });
      return;
    }

    // No free trials left — if user is subscribed, check subscriptions
    if (user.subscribed) {
      const activeSubs = await this.prisma.subscription.findMany({
        where: {
          userId,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Find a subscription that still has available credits
      const usable = activeSubs.find((s) => (s.totalCredits - s.usedCredits) > 0);
      if (usable) {
        await this.prisma.subscription.update({
          where: { id: usable.id },
          data: { usedCredits: { increment: 1 } as unknown as Prisma.IntFieldUpdateOperationsInput },
        });
        return;
      }

      throw new BadRequestException('Not enough credits left in subscription');
    }

    // No free trials and not subscribed
    throw new BadRequestException('Not enough credits left');
  }
}
