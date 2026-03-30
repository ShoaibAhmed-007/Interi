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
exports.FavouritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const amazon_s3_service_1 = require("../amazon-s3/amazon-s3.service");
let FavouritesService = class FavouritesService {
    prisma;
    s3;
    constructor(prisma, s3) {
        this.prisma = prisma;
        this.s3 = s3;
    }
    async getUserFavourites(userId) {
        const favourites = await this.prisma.favourite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                design: true,
            },
        });
        const results = await Promise.all(favourites.map(async (fav) => {
            const design = fav.design;
            let originalPresignedUrl = null;
            let originalPublicUrl = null;
            let originalS3Key = null;
            if (design.originalImageUrl) {
                const key = design.originalImageUrl;
                originalS3Key = key;
                try {
                    originalPresignedUrl =
                        await this.s3.generatePresignedDownloadUrl(key);
                    originalPublicUrl = this.buildPublicUrl(key);
                }
                catch {
                    originalPresignedUrl = null;
                }
            }
            let resultPresignedUrl = null;
            let resultPublicUrl = null;
            let resultS3Key = null;
            if (design.resultImageUrl) {
                const key = design.resultImageUrl;
                resultS3Key = key;
                try {
                    resultPresignedUrl =
                        await this.s3.generatePresignedDownloadUrl(key);
                    resultPublicUrl = this.buildPublicUrl(key);
                }
                catch {
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
        }));
        return results;
    }
    async addFavourite(userId, designId) {
        const design = await this.prisma.design.findUnique({
            where: { id: designId },
        });
        if (!design) {
            throw new common_1.NotFoundException(`Design with ID "${designId}" not found`);
        }
        const existing = await this.prisma.favourite.findUnique({
            where: { userId_designId: { userId, designId } },
        });
        if (existing) {
            throw new common_1.ConflictException('Design is already in favourites');
        }
        const favourite = await this.prisma.favourite.create({
            data: { userId, designId },
        });
        return { message: 'Design added to favourites', favouriteId: favourite.id };
    }
    async removeFavourite(userId, designId) {
        const existing = await this.prisma.favourite.findUnique({
            where: { userId_designId: { userId, designId } },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Favourite not found');
        }
        await this.prisma.favourite.delete({
            where: { userId_designId: { userId, designId } },
        });
        return { message: 'Design removed from favourites' };
    }
    buildPublicUrl(s3Key) {
        const bucket = process.env.AWS_S3_BUCKET;
        const region = process.env.AWS_REGION;
        return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
    }
};
exports.FavouritesService = FavouritesService;
exports.FavouritesService = FavouritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        amazon_s3_service_1.AmazonS3Service])
], FavouritesService);
//# sourceMappingURL=favourites.service.js.map