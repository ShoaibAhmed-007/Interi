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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavouritesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const favourites_service_1 = require("./favourites.service");
const add_favourite_dto_1 = require("./dto/add-favourite.dto");
const get_user_decorator_1 = require("../auth/decorator/get-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let FavouritesController = class FavouritesController {
    favouritesService;
    constructor(favouritesService) {
        this.favouritesService = favouritesService;
    }
    async getUserFavourites(userId) {
        return this.favouritesService.getUserFavourites(userId);
    }
    async addFavourite(userId, dto) {
        return this.favouritesService.addFavourite(userId, dto.designId);
    }
    async removeFavourite(userId, dto) {
        return this.favouritesService.removeFavourite(userId, dto.designId);
    }
};
exports.FavouritesController = FavouritesController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all favourited designs for the authenticated user',
        description: 'Returns a list of favourited designs with their createdAt timestamps, original and result image presigned URLs, public URLs, and S3 keys.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of favourited designs with image URLs',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized – invalid or missing JWT' }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FavouritesController.prototype, "getUserFavourites", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add a design to favourites',
        description: 'Adds the specified design to the authenticated user\'s favourites list.',
    }),
    (0, swagger_1.ApiBody)({ type: add_favourite_dto_1.AddFavouriteDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Design added to favourites' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Design not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Design is already in favourites' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized – invalid or missing JWT' }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_favourite_dto_1.AddFavouriteDto]),
    __metadata("design:returntype", Promise)
], FavouritesController.prototype, "addFavourite", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove a design from favourites',
        description: 'Removes the specified design from the authenticated user\'s favourites list.',
    }),
    (0, swagger_1.ApiBody)({ type: add_favourite_dto_1.AddFavouriteDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Design removed from favourites' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Favourite not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized – invalid or missing JWT' }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_favourite_dto_1.AddFavouriteDto]),
    __metadata("design:returntype", Promise)
], FavouritesController.prototype, "removeFavourite", null);
exports.FavouritesController = FavouritesController = __decorate([
    (0, swagger_1.ApiTags)('favourites'),
    (0, common_1.Controller)('favourites'),
    __metadata("design:paramtypes", [favourites_service_1.FavouritesService])
], FavouritesController);
//# sourceMappingURL=favourites.controller.js.map