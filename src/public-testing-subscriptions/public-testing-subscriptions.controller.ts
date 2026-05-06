import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddSubscriptionsDto } from './dto/add-subscriptions.dto';
import { PublicTestingSubscriptionsService } from './public-testing-subscriptions.service';

@ApiTags('public-testing-subscriptions')
@Controller('public-testing-subscriptions')
export class PublicTestingSubscriptionsController {
  constructor(private readonly svc: PublicTestingSubscriptionsService) {}

  @Post('add-subscriptions')
  @ApiOperation({
    summary: 'Add subscriptions (public testing endpoint)',
    description:
      'Public testing endpoint: creates a Subscription row for a user, sets `subscribed=true`, and assigns the given total credits. Do not expose in production.',
  })
  @ApiBody({ type: AddSubscriptionsDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription added successfully.',
    schema: {
      example: {
        success: true,
        userId: 'a1b2c3d4-uuid',
        subscribed: true,
        subscription: {
          id: 'sub-uuid',
          totalCredits: 50,
          usedCredits: 0,
          startDate: '2026-05-06T00:00:00.000Z',
          endDate: '2027-05-06T00:00:00.000Z',
          transactionIdentifier: 'test:plan_499_usd_50_uses:...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid payload or user not found.' })
  async addSubscriptions(@Body() dto: AddSubscriptionsDto) {
    const result = await this.svc.addSubscriptions(dto.userId, dto.credits, dto.subscriptionName);
    return { success: true, ...result };
  }
}

