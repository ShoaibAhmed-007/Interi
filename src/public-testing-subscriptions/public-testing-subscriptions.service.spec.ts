import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PublicTestingSubscriptionsService } from './public-testing-subscriptions.service';

describe('PublicTestingSubscriptionsService', () => {
  let svc: PublicTestingSubscriptionsService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    subscription: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      subscription: { create: jest.fn() },
      $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
    };

    const mod = await Test.createTestingModule({
      providers: [
        PublicTestingSubscriptionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    svc = mod.get(PublicTestingSubscriptionsService);
  });

  it('throws when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(svc.addSubscriptions('u1', 50, 'plan')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates subscription and sets subscribed=true', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', subscribed: false });
    prisma.user.update.mockResolvedValue({ id: 'u1', subscribed: true });
    prisma.subscription.create.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      totalCredits: 50,
      usedCredits: 0,
      startDate: new Date(),
      endDate: new Date(),
      transactionIdentifier: 'test:plan:uuid',
    });

    const res = await svc.addSubscriptions('u1', 50, 'plan');

    expect(res.userId).toBe('u1');
    expect(res.subscribed).toBe(true);
    expect(res.subscription.totalCredits).toBe(50);
    expect(res.subscription.usedCredits).toBe(0);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { subscribed: true },
    });
    expect(prisma.subscription.create).toHaveBeenCalled();
  });
});

