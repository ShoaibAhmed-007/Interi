import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not defined in .env');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; name: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    // Reject if user doesn't exist or has been logged out (refreshToken is null)
    if (!user || !user.refreshToken) throw new UnauthorizedException('Session expired, please log in again');
    const { hash: _, refreshToken: __, ...userWithoutSensitiveFields } = user;
    return userWithoutSensitiveFields;
  }
}
