"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
const design_module_1 = require("./design/design.module");
const openai_prompt_generation_module_1 = require("./openai-prompt-generation/openai-prompt-generation.module");
const flux_image_generation_module_1 = require("./flux-image-generation/flux-image-generation.module");
const amazon_s3_module_1 = require("./amazon-s3/amazon-s3.module");
const design_history_module_1 = require("./design-history/design-history.module");
const public_testing_upload_module_1 = require("./public-testing-upload/public-testing-upload.module");
const favourites_module_1 = require("./favourites/favourites.module");
const revenuecat_module_1 = require("./revenuecat/revenuecat.module");
const public_testing_subscriptions_module_1 = require("./public-testing-subscriptions/public-testing-subscriptions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            design_module_1.DesignModule,
            openai_prompt_generation_module_1.OpenaiPromptGenerationModule,
            flux_image_generation_module_1.FluxImageGenerationModule,
            design_history_module_1.DesignHistoryModule,
            amazon_s3_module_1.AmazonS3Module,
            public_testing_upload_module_1.PublicTestingUploadModule,
            public_testing_subscriptions_module_1.PublicTestingSubscriptionsModule,
            favourites_module_1.FavouritesModule,
            revenuecat_module_1.RevenuecatModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map