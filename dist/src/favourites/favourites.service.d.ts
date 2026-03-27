import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
export declare class FavouritesService {
    private readonly prisma;
    private readonly s3;
    constructor(prisma: PrismaService, s3: AmazonS3Service);
    getUserFavourites(userId: string): Promise<{
        favouriteId: string;
        designId: string;
        createdAt: Date;
        original: {
            s3Key: string | null;
            publicUrl: string | null;
            presignedUrl: string | null;
        };
        result: {
            s3Key: string | null;
            publicUrl: string | null;
            presignedUrl: string | null;
        };
    }[]>;
    addFavourite(userId: string, designId: string): Promise<{
        message: string;
        favouriteId: string;
    }>;
    removeFavourite(userId: string, designId: string): Promise<{
        message: string;
    }>;
    private buildPublicUrl;
}
