import { Module } from '@nestjs/common';
import { OpenaiPromptGenerationController } from './openai-prompt-generation.controller';
import { OpenaiPromptGenerationService } from './openai-prompt-generation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OpenaiPromptGenerationController],
  providers: [OpenaiPromptGenerationService],
})
export class OpenaiPromptGenerationModule {}
