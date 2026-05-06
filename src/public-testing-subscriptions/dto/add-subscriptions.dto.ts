import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class AddSubscriptionsDto {
  @ApiProperty({
    example: 'a1b2c3d4-uuid',
    description: 'User id to grant subscription credits to (testing only).',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 50,
    description: 'Total credits to add in the new subscription row.',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({
    example: 'plan_499_usd_50_uses',
    description: 'Subscription name (testing only).',
  })
  @IsString()
  @IsNotEmpty()
  subscriptionName: string;
}

