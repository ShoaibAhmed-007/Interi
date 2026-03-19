import { Module } from '@nestjs/common';
import { AmazonS3Controller } from './amazon-s3.controller';
import { AmazonS3Service } from './amazon-s3.service';

@Module({
  controllers: [AmazonS3Controller],
  providers: [AmazonS3Service],
  // Export the service so other modules can inject it if needed (e.g. auto-upload after AI generation)
  exports: [AmazonS3Service],
})
export class AmazonS3Module {}
