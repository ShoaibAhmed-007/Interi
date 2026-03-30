import { FavouritesService } from './favourites.service';
import { AddFavouriteDto } from './dto/add-favourite.dto';
export declare class FavouritesController {
    private readonly favouritesService;
    constructor(favouritesService: FavouritesService);
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
    addFavourite(userId: string, dto: AddFavouriteDto): Promise<{
        message: string;
        favouriteId: string;
    }>;
    removeFavourite(userId: string, dto: AddFavouriteDto): Promise<{
        message: string;
    }>;
}
