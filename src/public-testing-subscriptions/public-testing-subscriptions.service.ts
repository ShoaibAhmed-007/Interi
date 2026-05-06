import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicTestingSubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async addSubscriptions(userId: string, totalCredits: number, subscriptionName: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const transactionIdentifier = `test:${subscriptionName}:${randomUUID()}`;

    const [updatedUser, subscription] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { subscribed: true },
      }),
      this.prisma.subscription.create({
        data: {
          userId,
          totalCredits,
          usedCredits: 0,
          startDate: now,
          endDate,
          transactionIdentifier,
        },
      }),
    ]);

    return {
      userId: updatedUser.id,
      subscribed: updatedUser.subscribed,
      subscription,
    };
  }
}

