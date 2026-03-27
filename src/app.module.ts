import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { DesignModule } from './design/design.module';
import { OpenaiPromptGenerationModule } from './openai-prompt-generation/openai-prompt-generation.module';
import { FluxImageGenerationModule } from './flux-image-generation/flux-image-generation.module';
import { AmazonS3Module } from './amazon-s3/amazon-s3.module';
import { DesignHistoryModule } from './design-history/design-history.module';
import { PublicTestingUploadModule } from './public-testing-upload/public-testing-upload.module';
import { FavouritesModule } from './favourites/favourites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DesignModule,
    OpenaiPromptGenerationModule,
    FluxImageGenerationModule,
    DesignHistoryModule,
    AmazonS3Module,
    PublicTestingUploadModule,
    FavouritesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
