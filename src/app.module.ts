import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { DesignModule } from './design/design.module';
import { OpenaiPromptGenerationModule } from './openai-prompt-generation/openai-prompt-generation.module';
import { FluxImageGenerationModule } from './flux-image-generation/flux-image-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DesignModule,
    OpenaiPromptGenerationModule,
    FluxImageGenerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
