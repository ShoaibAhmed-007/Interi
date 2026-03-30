import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RevenueCatGuard } from './revenuecat.guard';
import { RevenueCatService } from './revenuecat.service';

@ApiTags('webhooks')
@Controller()
export class RevenueCatController {
  constructor(private readonly svc: RevenueCatService) {}

  @Post('webhooks/revenuecat')
  @UseGuards(RevenueCatGuard)
  @ApiOperation({ summary: 'Receive RevenueCat webhooks' })
  @ApiBody({ description: 'RevenueCat webhook payload', required: true })
  @ApiResponse({ status: 200, description: 'Acknowledged' })
  async receive(@Body() body: any) {
    return this.svc.handleWebhook(body);
  }
}
