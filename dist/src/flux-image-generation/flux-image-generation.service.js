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
            const prismaAny = this.prisma;
            await prismaAny.designHistory.create({
                data: {
                    userId: design.userId,
                    designId: design.id,
                    originalImageKey: design.originalImageUrl,
                    resultImageKey: upload.s3Key,
                },
            });
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
    async transferStyleBetweenS3Keys(userId, sourceKey, targetKey, location) {
        const apiKey = process.env.BFL_API_KEY;
        if (!apiKey) {
            throw new common_1.InternalServerErrorException('MISSING_API_KEY: BFL_API_KEY is not defined in .env');
        }
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            throw new common_1.InternalServerErrorException('MISSING_API_KEY: OPENAI_API_KEY is not defined in .env');
        }
        let jobId = null;
        try {
            const src = await this.s3.downloadBuffer(sourceKey);
            const tgt = await this.s3.downloadBuffer(targetKey);
            const srcBuf = src.buffer;
            const tgtBuf = tgt.buffer;
            const srcContentType = src.contentType || 'image/jpeg';
            const tgtContentType = tgt.contentType || 'image/jpeg';
            const sourceUrl = await this.s3.generatePresignedDownloadUrl(sourceKey);
            const analysisInstruction = 'Your task is to only tell me the following things regarding the image I shared. Tell me the location of the room (for example: bedroom or living room), tell me the dominant color palette, and tell me the style (for example: modern, medieval, rustic). Respond in this exact format only: location, color, style.';
            const openaiResp = await this.safeFetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: analysisInstruction },
                                { type: 'image_url', image_url: { url: sourceUrl } },
                            ],
                        },
                    ],
                    max_tokens: 200,
                    temperature: 0.2,
                }),
            }, 'openaiStyleAnalysis', 30000, 2);
            if (!openaiResp.ok) {
                const errText = await openaiResp.text().catch(() => '<no-body>');
                throw new Error(`OpenAI analysis failed: ${openaiResp.status} - ${errText}`);
            }
            const openaiJson = await openaiResp.json();
            const analysisText = openaiJson?.choices?.[0]?.message?.content;
            if (!analysisText) {
                throw new Error('OpenAI analysis returned no content');
            }
            const usage = openaiJson?.usage || {};
            const promptTokens = Number(usage.prompt_tokens || 0);
            const completionTokens = Number(usage.completion_tokens || 0);
            const openaiCostUsd = (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.6;
            console.log('[FluxImageGeneration] apply-style AI response:', analysisText);
            console.log('[FluxImageGeneration] apply-style OpenAI estimated cost USD:', openaiCostUsd.toFixed(6));
            const parsed = analysisText.replace(/\n/g, ' ').split(',').map((x) => x.trim()).filter(Boolean);
            if (parsed.length < 3) {
                throw new Error('OpenAI analysis format invalid. Expected: location, color, style');
            }
            const aiLocation = parsed[0] || location;
            const colorPalette = parsed[1];
            const style = parsed[2];
            const prompt = `Do not change dimensions and the result should not surpass 1 megapixel.\n\nThe picture is of ${aiLocation}.\nMake me a picture which has following properties.\nMake the style ${style}.\nThe color palette should be ${colorPalette}.`;
            console.log('[FluxImageGeneration] apply-style Flux prompt:', prompt);
            const bflBase = process.env.BFL_API_ENDPOINT || 'https://api.bfl.ai';
            const endpoint = `${bflBase.replace(/\/$/, '')}/v1/flux-2-pro-preview`;
            const body = {
                prompt,
                input_image: `data:${tgtContentType};base64,${tgtBuf.toString('base64')}`,
                style_image: `data:${srcContentType};base64,${srcBuf.toString('base64')}`,
                output_format: 'jpeg',
                safety_tolerance: 2,
            };
            const submitResponse = await this.safeFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Key': apiKey,
                },
                body: JSON.stringify(body),
            }, 'submitStyleTransfer', 300000, 3);
            if (!submitResponse.ok) {
                const errDetails = await submitResponse.text().catch(() => '<no-body>');
                throw new Error(`BFL Job Submission Failed: ${submitResponse.status} - ${errDetails}`);
            }
            const submitData = await submitResponse.json();
            jobId = submitData.id;
            if (!jobId)
                throw new Error('BFL submission did not return job id');
            let generatedImageUrl = null;
            let attempt = 0;
            const maxAttempts = 60;
            while (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, 2000));
                attempt++;
                const pollUrl = `${bflBase.replace(/\/$/, '')}/v1/get_result?id=${encodeURIComponent(jobId)}`;
                const pollResponse = await this.safeFetch(pollUrl, {
                    method: 'GET',
                    headers: { 'X-Key': apiKey },
                }, 'pollStyle', 10000, 1);
                if (!pollResponse.ok)
                    continue;
                const pollData = await pollResponse.json();
                if (pollData.status === 'Ready') {
                    generatedImageUrl = pollData.result.sample;
                    break;
                }
                if (pollData.status === 'Failed' || pollData.status === 'Error') {
                    throw new Error(`BFL Job Failed with status: ${pollData.status}`);
                }
            }
            if (!generatedImageUrl)
                throw new Error('BFL API Polling timed out');
            const genResp = await this.safeFetch(generatedImageUrl, undefined, 'generatedImage', 20000, 2);
            if (!genResp.ok)
                throw new Error('Failed to download generated image');
            const genBuffer = Buffer.from(await genResp.arrayBuffer());
            const genContentType = genResp.headers.get('content-type') || 'image/jpeg';
            const upload = await this.s3.uploadBuffer(genBuffer, 'jpg', genContentType);
            const fluxCostUsd = 0.05;
            console.log('[FluxImageGeneration] apply-style Flux estimated cost USD:', fluxCostUsd.toFixed(2));
            return {
                s3Key: upload.s3Key,
                publicUrl: upload.publicUrl,
                unsignedUrl: upload.publicUrl,
            };
        }
        catch (error) {
            console.error('[FluxImageGeneration] Style transfer failed', { sourceKey, targetKey, jobId, error });
            const debugEnabled = process.env.DEBUG_FLUX === 'true' || process.env.NODE_ENV !== 'production';
            const errMessage = (error && error.message) ? error.message : String(error);
            if (debugEnabled) {
                throw new common_1.InternalServerErrorException(`Failed to transfer style via Flux: ${errMessage}`);
            }
            throw new common_1.InternalServerErrorException('Failed to transfer style via Flux.');
        }
    }
    async analyzeImageAndApplyStyle(userId, imgA, imgB, location = 'unknown location') {
        await this.checkForCredits(userId);
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey)
            throw new common_1.InternalServerErrorException('MISSING_API_KEY: OPENAI_API_KEY is not defined');
        const bflApiKey = process.env.BFL_API_KEY;
        if (!bflApiKey)
            throw new common_1.InternalServerErrorException('MISSING_API_KEY: BFL_API_KEY is not defined');
        const resolveToUrl = async (ref) => {
            if (ref.startsWith('http'))
                return ref;
            return this.s3.generatePresignedDownloadUrl(ref);
        };
        const fetchBufferFromRef = async (ref) => {
            if (ref.startsWith('http')) {
                const resp = await this.safeFetch(ref, undefined, 'downloader', 20000, 1);
                if (!resp.ok)
                    throw new Error('Failed to download image from URL');
                const buf = Buffer.from(await resp.arrayBuffer());
                const ct = resp.headers.get('content-type') || 'image/jpeg';
                return { buffer: buf, contentType: ct };
            }
            const dl = await this.s3.downloadBuffer(ref);
            return { buffer: dl.buffer, contentType: dl.contentType || 'image/jpeg' };
        };
        try {
            const imgAUrl = await resolveToUrl(imgA);
            const userMsg = 'Your task is to only tell me the following things regarding the image I shared. Tell me the location of the room (for example: bedroom or living room), tell me the dominant color palette, and tell me the style (for example: modern, medieval, rustic). Respond in this exact format only: location, color, style.';
            const openaiResp = await this.safeFetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: userMsg },
                                { type: 'image_url', image_url: { url: imgAUrl } },
                            ],
                        },
                    ],
                    max_tokens: 200,
                    temperature: 0.2,
                }),
            }, 'openai', 30000, 2);
            if (!openaiResp.ok) {
                const txt = await openaiResp.text().catch(() => '<no-body>');
                throw new Error(`OpenAI analysis failed: ${openaiResp.status} - ${txt}`);
            }
            const openaiJson = await openaiResp.json();
            const content = openaiJson?.choices?.[0]?.message?.content;
            if (!content)
                throw new Error('OpenAI returned no content');
            const usage = openaiJson?.usage || {};
            const promptTokens = Number(usage.prompt_tokens || 0);
            const completionTokens = Number(usage.completion_tokens || 0);
            const inputPer1M = 0.15;
            const outputPer1M = 0.6;
            const openaiCostUsd = (promptTokens / 1_000_000) * inputPer1M + (completionTokens / 1_000_000) * outputPer1M;
            console.log('[FluxImageGeneration] AI analysis (location,color,style):', content);
            console.log('[FluxImageGeneration] OpenAI estimated cost USD:', openaiCostUsd.toFixed(6));
            const cleaned = content.replace(/\n/g, ' ').trim();
            const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
            if (parts.length < 3)
                throw new Error('OpenAI did not return 3 comma-separated items');
            const detectedLocation = parts[0] || location;
            const colorPalette = parts[1];
            const style = parts[2];
            const prompt = `Do not change dimensions and the result should not surpass 1 megapixel.\n\nThe picture is of ${detectedLocation}.\nMake me a picture which has following properties.\nMake the style ${style}.\nThe color palette should be ${colorPalette}.`;
            console.log('[FluxImageGeneration] Flux prompt:', prompt);
            const a = await fetchBufferFromRef(imgA);
            const b = await fetchBufferFromRef(imgB);
            const bflBase = process.env.BFL_API_ENDPOINT || 'https://api.bfl.ai';
            const endpoint = `${bflBase.replace(/\/$/, '')}/v1/flux-2-pro-preview`;
            const body = {
                prompt,
                input_image: `data:${b.contentType};base64,${b.buffer.toString('base64')}`,
                style_image: `data:${a.contentType};base64,${a.buffer.toString('base64')}`,
                output_format: 'jpeg',
                safety_tolerance: 2,
            };
            const submitResponse = await this.safeFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Key': bflApiKey,
                },
                body: JSON.stringify(body),
            }, 'submitStyleFromAnalysis', 300000, 3);
            if (!submitResponse.ok) {
                const errDetails = await submitResponse.text().catch(() => '<no-body>');
                throw new Error(`BFL Job Submission Failed: ${submitResponse.status} - ${errDetails}`);
            }
            const submitData = await submitResponse.json();
            const jobId = submitData.id;
            if (!jobId)
                throw new Error('BFL submission did not return job id');
            let generatedImageUrl = null;
            let attempt = 0;
            const maxAttempts = 60;
            while (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, 2000));
                attempt++;
                const pollUrl = `${bflBase.replace(/\/$/, '')}/v1/get_result?id=${encodeURIComponent(jobId)}`;
                const pollResponse = await this.safeFetch(pollUrl, { method: 'GET', headers: { 'X-Key': bflApiKey } }, 'pollAnalysis', 10000, 1);
                if (!pollResponse.ok)
                    continue;
                const pollData = await pollResponse.json();
                if (pollData.status === 'Ready') {
                    generatedImageUrl = pollData.result.sample;
                    break;
                }
                if (pollData.status === 'Failed' || pollData.status === 'Error') {
                    throw new Error(`BFL Job Failed with status: ${pollData.status}`);
                }
            }
            if (!generatedImageUrl)
                throw new Error('BFL API Polling timed out');
            const genResp = await this.safeFetch(generatedImageUrl, undefined, 'generatedImage', 20000, 2);
            if (!genResp.ok)
                throw new Error('Failed to download generated image');
            const genBuffer = Buffer.from(await genResp.arrayBuffer());
            const genContentType = genResp.headers.get('content-type') || 'image/jpeg';
            const upload = await this.s3.uploadBuffer(genBuffer, 'jpg', genContentType);
            const fluxCostUsd = 0.05;
            console.log('[FluxImageGeneration] Flux estimated cost USD:', fluxCostUsd.toFixed(2));
            return {
                s3Key: upload.s3Key,
                publicUrl: upload.publicUrl,
                unsignedUrl: upload.publicUrl,
            };
        }
        catch (err) {
            console.error('[FluxImageGeneration] analyzeAndApplyStyle failed', { imgA: imgA, imgB: imgB, error: err });
            const debugEnabled = process.env.DEBUG_FLUX === 'true' || process.env.NODE_ENV !== 'production';
            const msg = (err && err.message) ? err.message : String(err);
            if (debugEnabled)
                throw new common_1.InternalServerErrorException(`Failed analyze/apply: ${msg}`);
            throw new common_1.InternalServerErrorException('Failed to analyze image and apply style.');
        }
    }
};
exports.FluxImageGenerationService = FluxImageGenerationService;
exports.FluxImageGenerationService = FluxImageGenerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, amazon_s3_service_1.AmazonS3Service])
], FluxImageGenerationService);
//# sourceMappingURL=flux-image-generation.service.js.map