import { Module } from '@nestjs/common';
import { FluxImageGenerationController } from './flux-image-generation.controller';
import { FluxImageGenerationService } from './flux-image-generation.service';

@Module({
  controllers: [FluxImageGenerationController],
  providers: [FluxImageGenerationService],
})
export class FluxImageGenerationModule {}
