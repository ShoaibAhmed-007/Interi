import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavouritesService } from './favourites.service';
import { AddFavouriteDto } from './dto/add-favourite.dto';
import { GetUser } from '../auth/decorator/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('favourites')
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all favourited designs for the authenticated user',
    description:
      'Returns a list of favourited designs with their createdAt timestamps, original and result image presigned URLs, public URLs, and S3 keys.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of favourited designs with image URLs',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized – invalid or missing JWT' })
  async getUserFavourites(@GetUser('id') userId: string) {
    return this.favouritesService.getUserFavourites(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Add a design to favourites',
    description: 'Adds the specified design to the authenticated user\'s favourites list.',
  })
  @ApiBody({ type: AddFavouriteDto })
  @ApiResponse({ status: 201, description: 'Design added to favourites' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  @ApiResponse({ status: 409, description: 'Design is already in favourites' })
  @ApiResponse({ status: 401, description: 'Unauthorized – invalid or missing JWT' })
  async addFavourite(
    @GetUser('id') userId: string,
    @Body() dto: AddFavouriteDto,
  ) {
    return this.favouritesService.addFavourite(userId, dto.designId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Remove a design from favourites',
    description: 'Removes the specified design from the authenticated user\'s favourites list.',
  })
  @ApiBody({ type: AddFavouriteDto })
  @ApiResponse({ status: 200, description: 'Design removed from favourites' })
  @ApiResponse({ status: 404, description: 'Favourite not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized – invalid or missing JWT' })
  async removeFavourite(
    @GetUser('id') userId: string,
    @Body() dto: AddFavouriteDto,
  ) {
    return this.favouritesService.removeFavourite(userId, dto.designId);
  }
}
