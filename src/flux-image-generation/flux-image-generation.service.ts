import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
import { Prisma } from '@prisma/client';
import { resolve } from 'dns';
import { promisify } from 'util';

@Injectable()
export class FluxImageGenerationService {
  constructor(private prisma: PrismaService, private s3: AmazonS3Service) {}

  private async testDNS(hostname: string): Promise<string | null> {
    try {
      const dnsResolve4 = promisify(resolve);
      const addresses = await dnsResolve4(hostname);
      return addresses?.[0] || null;
    } catch (err) {
      console.warn('[FluxImageGeneration] DNS resolution failed for', { hostname, err });
      return null;
    }
  }

  private async safeFetch(
    url: string,
    options: any = undefined,
    label = 'fetch',
    timeoutMs = 30000,
    maxRetries = 2,
  ) {
    let lastErr: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const resp = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        return resp;
      } catch (err) {
        clearTimeout((err as any).timeout);
        lastErr = err;

        // Extract error message and cause chain
        const errMsg = err && (err as any).message ? (err as any).message : String(err);
        const cause = (err as any).cause;
        const causeMsg = cause && (cause as any).message ? (cause as any).message : '';
        const causeCode = cause && (cause as any).code ? (cause as any).code : (err as any).code;

        const fullErrMsg = causeMsg ? `${errMsg} (cause: ${causeMsg})` : errMsg;

        // Detect transient errors more comprehensively
        const isAborted = errMsg.includes('abort') || causeMsg.includes('abort');
        const isTimeout =
          errMsg.includes('Timeout') ||
          causeMsg.includes('Timeout') ||
          causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
          causeCode === 'UND_ERR_SOCKET_TIMEOUT' ||
          causeCode === 'ETIMEDOUT';
        const isNetworkError =
          causeCode === 'ECONNREFUSED' ||
          causeCode === 'ENOTFOUND' ||
          causeCode === 'EHOSTUNREACH' ||
          causeCode === 'ENETUNREACH' ||
          causeMsg.includes('getaddrinfo') ||
          causeMsg.includes('Connect');

        const isTransient = isAborted || isTimeout || isNetworkError;

        // On first attempt, run DNS diagnostics if it's a network error
        let dnsResult: string | null | undefined;
        if (attempt === 0 && (isTimeout || isNetworkError)) {
          try {
            const urlObj = new URL(url);
            dnsResult = await this.testDNS(urlObj.hostname);
          } catch (e) {
            console.warn('[FluxImageGeneration] Failed to parse URL for DNS test', { url });
          }
        }

        const warnLog: any = {
          url,
          label,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          errMsg: fullErrMsg,
          causeCode,
          isAborted,
          isTimeout,
          isNetworkError,
          isTransient,
        };

        if (dnsResult) {
          warnLog.dnsResolvedIp = dnsResult;
        }

        if (attempt === 0 && !dnsResult && isNetworkError) {
          warnLog.dnsDiagnostics = 'DNS resolution may have failed — check network connectivity and firewall rules';
        }

        console.warn('[FluxImageGeneration] Fetch attempt failed', warnLog);

        if (attempt < maxRetries && isTransient) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.info(`[FluxImageGeneration] Retrying ${label} in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw new Error(
          `fetch failed (${label}, attempt ${attempt + 1}/${maxRetries + 1}): ${fullErrMsg}`,
        );
      }
    }

    throw new Error(`fetch failed (${label}): exhausted ${maxRetries + 1} retries`);
  }
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

    let jobId: string | null = null;
    try {
      let originalBuffer: Buffer;
      let originalContentType = 'image/jpeg';

      // If originalImageUrl looks like an S3 key (no http/https), download from S3
      if (!design.originalImageUrl.startsWith('http')) {
        const s3Key = design.originalImageUrl;
        const downloaded = await this.s3.downloadBuffer(s3Key);
        originalBuffer = downloaded.buffer;
        originalContentType = downloaded.contentType || originalContentType;
      } else {
        const originalResp = await this.safeFetch(
          design.originalImageUrl,
          undefined,
          'originalImage',
          15000, // 15 sec timeout
          1, // 1 retry
        );
        if (!originalResp.ok) {
          throw new Error('Failed to download original image');
        }
        originalBuffer = Buffer.from(await originalResp.arrayBuffer());
        originalContentType = originalResp.headers.get('content-type') || originalContentType;
      }

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
      const bflBase = process.env.BFL_API_ENDPOINT || 'https://api.bfl.ml';
      const endpoint = `${bflBase.replace(/\/$/, '')}/v1/flux-pro-1.0-image-to-image`;
      const maskedApiKey = apiKey ? `${apiKey.slice(0, 8)}...` : null;
      const imageBase64 = originalBuffer.toString('base64');
      console.info('[FluxImageGeneration] Submitting job to Flux', {
        designId,
        endpoint,
        apiKeySet: !!apiKey,
        apiKeyMask: maskedApiKey,
        promptSnippet: prompt.slice(0, 200),
        imageSizeBytes: originalBuffer.length,
      });

      const submitResponse = await this.safeFetch(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Key': apiKey,
          },
          body: JSON.stringify({
            prompt,
            image: `data:image/jpeg;base64,${imageBase64}`,
            prompt_upsampling: false,
            strength: 0.8,
            // Requesting size; API may ignore, but include to constrain to ~1MP
            size: '1024x1024',
          }),
        },
        'submitJob',
        300000, // 5 min timeout for large image upload
        3, // 3 retries for transient network issues
      );

      if (!submitResponse.ok) {
        const errDetails = await submitResponse.text();
        console.error('[FluxImageGeneration] BFL job submission failed', { designId, status: submitResponse.status, body: errDetails });
        throw new Error(`BFL Job Submission Failed: ${submitResponse.status} - ${errDetails}`);
      }

      const submitData = await submitResponse.json();
      jobId = submitData.id;
      if (!jobId) {
        console.error('[FluxImageGeneration] BFL submission returned no job id', { designId, submitData });
        throw new Error('BFL submission did not return job id');
      }

      // Poll for result
      let generatedImageUrl = null;
      let attempt = 0;
      const maxAttempts = 60; // longer polling

      while (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempt++;

        const pollUrl = `${bflBase.replace(/\/$/, '')}/v1/get_result?id=${encodeURIComponent(jobId)}`;
        const pollResponse = await this.safeFetch(
          pollUrl,
          {
            method: 'GET',
            headers: { 'X-Key': apiKey },
          },
          'poll',
          10000, // 10 sec timeout per poll attempt
          1, // 1 retry for transient failures
        );

        if (!pollResponse.ok) {
          const txt = await pollResponse.text().catch(() => '<no-body>');
          console.warn('[FluxImageGeneration] BFL poll returned non-OK', { designId, jobId, attempt, status: pollResponse.status, body: txt });
          continue;
        }

        const pollData = await pollResponse.json();
        const status = pollData.status;
        if (status === 'Ready') {
          generatedImageUrl = pollData.result.sample;
          break;
        } else if (status === 'Failed' || status === 'Error') {
          console.error('[FluxImageGeneration] BFL reported job failure', { designId, jobId, attempt, pollData });
          throw new Error(`BFL Job Failed with status: ${status}`);
        }
      }

      if (!generatedImageUrl) throw new Error('BFL API Polling timed out');

      // Download generated image
      const genResp = await this.safeFetch(
        generatedImageUrl,
        undefined,
        'generatedImage',
        20000, // 20 sec timeout
        2, // 2 retries
      );
      if (!genResp.ok) {
        const txt = await genResp.text().catch(() => '<no-body>');
        console.error('[FluxImageGeneration] Failed to download generated image', { designId, jobId, status: genResp.status, body: txt });
        throw new Error('Failed to download generated image');
      }
      const genBuffer = Buffer.from(await genResp.arrayBuffer());
      const genContentType = genResp.headers.get('content-type') || 'image/jpeg';

      // Upload to S3 interior-app/ folder
      const upload = await this.s3.uploadBuffer(genBuffer, 'jpg', genContentType);

      // Persist the result S3 key in the Design.resultImageUrl field
      await this.prisma.design.update({ where: { id: designId }, data: { resultImageUrl: upload.s3Key } });

      const presigned = await this.s3.generatePresignedDownloadUrl(upload.s3Key);

      return {
        imageUrl: upload.publicUrl,
        presignedUrl: presigned,
        promptUsed: prompt,
        s3Key: upload.s3Key,
      };
    } catch (error) {
      console.error('[FluxImageGeneration] Flux Pro generation failed', { designId, jobId, error });
      if (error && (error as any).stack) console.error((error as any).stack);

      const debugEnabled = process.env.DEBUG_FLUX === 'true' || process.env.NODE_ENV !== 'production';
      const errMessage = (error && (error as any).message) ? (error as any).message : String(error);
      if (debugEnabled) {
        throw new InternalServerErrorException(`Failed to generate image via Flux: ${errMessage}`);
      }

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
