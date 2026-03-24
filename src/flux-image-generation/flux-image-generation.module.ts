import { Module } from '@nestjs/common';
import { FluxImageGenerationController } from './flux-image-generation.controller';
import { FluxImageGenerationService } from './flux-image-generation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AmazonS3Module } from '../amazon-s3/amazon-s3.module';

@Module({
  imports: [PrismaModule, AmazonS3Module],
  controllers: [FluxImageGenerationController],
  providers: [FluxImageGenerationService],
})
export class FluxImageGenerationModule {}
