import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RevenueCatGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization as string | undefined;
    const expected = `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`;
    return auth === expected;
  }
}
