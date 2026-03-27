import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
export declare class FavouritesService {
    private readonly prisma;
    private readonly s3;
    constructor(prisma: PrismaService, s3: AmazonS3Service);
    getUserFavourites(userId: string): unknown;
    addFavourite(userId: string, designId: string): unknown;
    removeFavourite(userId: string, designId: string): unknown;
    private buildPublicUrl;
}
