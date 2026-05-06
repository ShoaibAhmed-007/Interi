import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicTestingSubscriptionsController } from './public-testing-subscriptions.controller';
import { PublicTestingSubscriptionsService } from './public-testing-subscriptions.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicTestingSubscriptionsController],
  providers: [PublicTestingSubscriptionsService],
})
export class PublicTestingSubscriptionsModule {}

