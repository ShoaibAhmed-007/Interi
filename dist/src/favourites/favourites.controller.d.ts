import { FavouritesService } from './favourites.service';
import { AddFavouriteDto } from './dto/add-favourite.dto';
export declare class FavouritesController {
    private readonly favouritesService;
    constructor(favouritesService: FavouritesService);
    getUserFavourites(userId: string): unknown;
    addFavourite(userId: string, dto: AddFavouriteDto): unknown;
    removeFavourite(userId: string, dto: AddFavouriteDto): unknown;
}
