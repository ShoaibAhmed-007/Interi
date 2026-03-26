import { Module } from '@nestjs/common';
import { AmazonS3Module } from '../amazon-s3/amazon-s3.module';
import { PublicTestingUploadController } from './public-testing-upload.controller';
import { PublicTestingUploadService } from './public-testing-upload.service';

@Module({
  imports: [AmazonS3Module],
  controllers: [PublicTestingUploadController],
  providers: [PublicTestingUploadService],
})
export class PublicTestingUploadModule {}
