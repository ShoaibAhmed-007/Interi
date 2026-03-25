import { Module } from '@nestjs/common';
import { DesignHistoryController } from './design-history.controller';
import { DesignHistoryService } from './design-history.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AmazonS3Module } from '../amazon-s3/amazon-s3.module';

@Module({
  imports: [PrismaModule, AmazonS3Module],
  controllers: [DesignHistoryController],
  providers: [DesignHistoryService],
  exports: [DesignHistoryService],
})
export class DesignHistoryModule {}
