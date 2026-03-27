"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavouritesModule = void 0;
const common_1 = require("@nestjs/common");
const favourites_controller_1 = require("./favourites.controller");
const favourites_service_1 = require("./favourites.service");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const amazon_s3_module_1 = require("../amazon-s3/amazon-s3.module");
let FavouritesModule = class FavouritesModule {
};
exports.FavouritesModule = FavouritesModule;
exports.FavouritesModule = FavouritesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, amazon_s3_module_1.AmazonS3Module],
        controllers: [favourites_controller_1.FavouritesController],
        providers: [favourites_service_1.FavouritesService],
        exports: [favourites_service_1.FavouritesService],
    })
], FavouritesModule);
//# sourceMappingURL=favourites.module.js.map