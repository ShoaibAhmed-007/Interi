"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluxImageGenerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const amazon_s3_service_1 = require("../amazon-s3/amazon-s3.service");
const dns_1 = require("dns");
const util_1 = require("util");
const undici_1 = require("undici");
let FluxImageGenerationService = class FluxImageGenerationService {
    prisma;
    s3;
    constructor(prisma, s3) {
        this.prisma = prisma;
        this.s3 = s3;
    }
    async testDNS(hostname) {
        try {
            const dnsResolve4 = (0, util_1.promisify)(dns_1.resolve);
            const addresses = await dnsResolve4(hostname);
            return addresses?.[0] || null;
        }
        catch (err) {
            console.warn('[FluxImageGeneration] DNS resolution failed for', { hostname, err });
            return null;
        }
    }
    buildFetchDispatcher() {
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
        if (proxyUrl) {
            console.info('[FluxImageGeneration] Using proxy', { proxyUrl });
            return new undici_1.ProxyAgent(proxyUrl);
        }
        return undefined;
    }
    async safeFetch(url, options = undefined, label = 'fetch', timeoutMs = 30000, maxRetries = 2) {
        const dispatcher = this.buildFetchDispatcher();
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), timeoutMs);
                const resp = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    ...(dispatcher ? { dispatcher } : {}),
                });
                clearTimeout(timeout);
                return resp;
            }
            catch (err) {
                clearTimeout(err.timeout);
                const errMsg = err && err.message ? err.message : String(err);
                const cause = err.cause;
                const causeMsg = cause && cause.message ? cause.message : '';
                const causeCode = cause && cause.code ? cause.code : err.code;
                const fullErrMsg = causeMsg ? `${errMsg} (cause: ${causeMsg})` : errMsg;
                const isAborted = errMsg.includes('abort') || causeMsg.includes('abort');
                const isTimeout = errMsg.includes('Timeout') ||
                    causeMsg.includes('Timeout') ||
                    causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
                    causeCode === 'UND_ERR_SOCKET_TIMEOUT' ||
                    causeCode === 'ETIMEDOUT';
                const isNetworkError = causeCode === 'ECONNREFUSED' ||
                    causeCode === 'ENOTFOUND' ||
                    causeCode === 'EHOSTUNREACH' ||
                    causeCode === 'ENETUNREACH' ||
                    causeMsg.includes('getaddrinfo') ||
                    causeMsg.includes('Connect');
                const isTransient = isAborted || isTimeout || isNetworkError;
                let dnsResult;
                if (attempt === 0 && (isTimeout || isNetworkError)) {
                    try {
                        const urlObj = new URL(url);
                        dnsResult = await this.testDNS(urlObj.hostname);
                    }
                    catch (e) {
                        console.warn('[FluxImageGeneration] Failed to parse URL for DNS test', { url });
                    }
                }
                const warnLog = {
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
                throw new Error(`fetch failed (${label}, attempt ${attempt + 1}/${maxRetries + 1}): ${fullErrMsg}`);
            }
        }
        throw new Error(`fetch failed (${label}): exhausted ${maxRetries + 1} retries`);
    }
    async generateImageForDesign(designId) {
        const design = await this.prisma.design.findUnique({ where: { id: designId } });
        if (!design) {
            throw new common_1.NotFoundException('Design not found');
        }
        const dto = {
            category: design.category,
            location: design.location,
            style: design.style,
            colorPalette: design.colorPalette,
        };
        if (!design.originalImageUrl) {
            throw new common_1.InternalServerErrorException('Design does not have an originalImageUrl');
        }
        const apiKey = process.env.BFL_API_KEY;
        if (!apiKey) {
            throw new common_1.InternalServerErrorException('MISSING_API_KEY: BFL_API_KEY is not defined in .env');
        }
        let jobId = null;
        try {
            let originalBuffer;
            let originalContentType = 'image/jpeg';
            if (!design.originalImageUrl.startsWith('http')) {
                const s3Key = design.originalImageUrl;
                const downloaded = await this.s3.downloadBuffer(s3Key);
                originalBuffer = downloaded.buffer;
                originalContentType = downloaded.contentType || originalContentType;
            }
            else {
                const originalResp = await this.safeFetch(design.originalImageUrl, undefined, 'originalImage', 15000, 1);
                if (!originalResp.ok) {
                    throw new Error('Failed to download original image');
                }
                originalBuffer = Buffer.from(await originalResp.arrayBuffer());
                originalContentType = originalResp.headers.get('content-type') || originalContentType;
            }
            const prompt = `Do not change dimensions and the result should not surpass 1 megapixel.

The picture is of ${dto.location}.
You need to change the ${dto.category}.
Make the style ${dto.style}.
The color palette should be ${dto.colorPalette}.`;
            const bflBase = process.env.BFL_API_ENDPOINT || 'https://api.bfl.ai';
            const endpoint = `${bflBase.replace(/\/$/, '')}/v1/flux-2-pro-preview`;
            const maskedApiKey = apiKey ? `${apiKey.slice(0, 8)}...` : null;
            const imageBase64 = originalBuffer.toString('base64');
            const estimatedPriceCents = 5;
            console.info('[FluxImageGeneration] Submitting job to FLUX.2 Pro:', {
                designId,
                endpoint,
                apiKeySet: !!apiKey,
                apiKeyMask: maskedApiKey,
                promptSnippet: prompt.replace(/\n/g, ' ').slice(0, 150) + '...',
                imageSizeBytes: originalBuffer.length,
                estimatedCost: `$${(estimatedPriceCents / 100).toFixed(2)} USD`,
            });
            const submitResponse = await this.safeFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Key': apiKey,
                },
                body: JSON.stringify({
                    prompt,
                    input_image: `data:${originalContentType};base64,${imageBase64}`,
                    output_format: 'jpeg',
                    safety_tolerance: 2,
                }),
            }, 'submitJob', 300000, 3);
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
            let generatedImageUrl = null;
            let attempt = 0;
            const maxAttempts = 60;
            while (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                attempt++;
                const pollUrl = `${bflBase.replace(/\/$/, '')}/v1/get_result?id=${encodeURIComponent(jobId)}`;
                const pollResponse = await this.safeFetch(pollUrl, {
                    method: 'GET',
                    headers: {
                        'X-Key': apiKey,
                    },
                }, 'poll', 10000, 1);
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
                }
                else if (status === 'Failed' || status === 'Error') {
                    console.error('[FluxImageGeneration] BFL reported job failure', { designId, jobId, attempt, pollData });
                    throw new Error(`BFL Job Failed with status: ${status}`);
                }
            }
            if (!generatedImageUrl)
                throw new Error('BFL API Polling timed out');
            const genResp = await this.safeFetch(generatedImageUrl, undefined, 'generatedImage', 20000, 2);
            if (!genResp.ok) {
                const txt = await genResp.text().catch(() => '<no-body>');
                console.error('[FluxImageGeneration] Failed to download generated image', { designId, jobId, status: genResp.status, body: txt });
                throw new Error('Failed to download generated image');
            }
            const genBuffer = Buffer.from(await genResp.arrayBuffer());
            const genContentType = genResp.headers.get('content-type') || 'image/jpeg';
            const upload = await this.s3.uploadBuffer(genBuffer, 'jpg', genContentType);
            await this.prisma.design.update({ where: { id: designId }, data: { resultImageUrl: upload.s3Key } });
            const presigned = await this.s3.generatePresignedDownloadUrl(upload.s3Key);
            return {
                imageUrl: upload.publicUrl,
                presignedUrl: presigned,
                promptUsed: prompt,
                s3Key: upload.s3Key,
            };
        }
        catch (error) {
            console.error('[FluxImageGeneration] Flux Pro generation failed', { designId, jobId, error });
            if (error && error.stack)
                console.error(error.stack);
            const debugEnabled = process.env.DEBUG_FLUX === 'true' || process.env.NODE_ENV !== 'production';
            const errMessage = (error && error.message) ? error.message : String(error);
            if (debugEnabled) {
                throw new common_1.InternalServerErrorException(`Failed to generate image via Flux: ${errMessage}`);
            }
            throw new common_1.InternalServerErrorException('Failed to generate image via Flux.');
        }
    }
    async checkForCredits(userId) {
        const now = new Date();
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.freeTrialsLeft && user.freeTrialsLeft > 0) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { freeTrialsLeft: { decrement: 1 } },
            });
            return;
        }
        if (user.subscribed) {
            const activeSubs = await this.prisma.subscription.findMany({
                where: {
                    userId,
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
                orderBy: { createdAt: 'desc' },
            });
            const usable = activeSubs.find((s) => (s.totalCredits - s.usedCredits) > 0);
            if (usable) {
                await this.prisma.subscription.update({
                    where: { id: usable.id },
                    data: { usedCredits: { increment: 1 } },
                });
                return;
            }
            throw new common_1.BadRequestException('Not enough credits left in subscription');
        }
        throw new common_1.BadRequestException('Not enough credits left');
    }
};
exports.FluxImageGenerationService = FluxImageGenerationService;
exports.FluxImageGenerationService = FluxImageGenerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, amazon_s3_service_1.AmazonS3Service])
], FluxImageGenerationService);
//# sourceMappingURL=flux-image-generation.service.js.map