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
exports.DesignHistoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const amazon_s3_service_1 = require("../amazon-s3/amazon-s3.service");
let DesignHistoryService = class DesignHistoryService {
    prisma;
    s3;
    constructor(prisma, s3) {
        this.prisma = prisma;
        this.s3 = s3;
    }
    async getUserDesignHistory(userId) {
        const designs = await this.prisma.design.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        const mapped = await Promise.all(designs.map(async (d) => {
            const originalKeyOrUrl = d.originalImageUrl || null;
            const resultKeyOrUrl = d.resultImageUrl || null;
            let originalUrl = originalKeyOrUrl;
            let resultUrl = resultKeyOrUrl;
            try {
                if (originalKeyOrUrl && !originalKeyOrUrl.startsWith('http')) {
                    originalUrl = await this.s3.generatePresignedDownloadUrl(originalKeyOrUrl);
                }
            }
            catch (e) {
                console.warn('[DesignHistory] Failed to generate presigned URL for original image', { designId: d.id, err: e?.message ?? e });
            }
            try {
                if (resultKeyOrUrl && !resultKeyOrUrl.startsWith('http')) {
                    resultUrl = await this.s3.generatePresignedDownloadUrl(resultKeyOrUrl);
                }
            }
            catch (e) {
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
        }));
        return mapped;
    }
};
exports.DesignHistoryService = DesignHistoryService;
exports.DesignHistoryService = DesignHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, amazon_s3_service_1.AmazonS3Service])
], DesignHistoryService);
//# sourceMappingURL=design-history.service.js.map