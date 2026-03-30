import { Module } from '@nestjs/common';
import { RevenueCatController } from './revenuecat.controller';
import { RevenueCatService } from './revenuecat.service';
import { RevenueCatGuard } from './revenuecat.guard';
@Module({
  controllers: [RevenueCatController],
  providers: [RevenueCatService, RevenueCatGuard],
  exports: [RevenueCatService],
})
export class RevenuecatModule {}
