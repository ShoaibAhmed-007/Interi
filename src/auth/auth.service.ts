import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import AppleAuth from 'apple-signin-auth';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  getHealthStatus(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth',
    };
  }

  async signup(signupDto: SignUpDto) {
    try {
      // Generate the password hash
      const hash = await argon.hash(signupDto.password);

      // Save the user in db
      const user = await this.prisma.user.create({
        data: {
          email: signupDto.email,
          hash,
          name: signupDto.name,
        },
      });

      // Return the tokens
      const tokens = await this.signTokens(user.id, user.email, user.name ?? '');
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        console.error('Prisma error code:', error.code);
        console.error('Prisma error message:', error.message);
        if (error.code === 'P2002') {
          throw new BadRequestException('Email already exists');
        }
      }
      throw error;
    }
  }

  async signin(singinDto: SignInDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: singinDto.email },
      });
      // Check if user email exists
      if (!user) {
        throw new ForbiddenException('Credentials Invalid');
      }
      // Check if user registered via OAuth (no password)
      if (!user.hash) {
        throw new ForbiddenException('Credentials Invalid');
      }
      // Compare the password
      const pwMatchs = await argon.verify(user.hash, singinDto.password);
      if (!pwMatchs) {
        throw new ForbiddenException('Credentials Invalid');
      }
      // Return the tokens
      const tokens = await this.signTokens(user.id, user.email, user.name ?? '');
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      console.error('Signin error:', error);

      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException('Signin failed');
    }
  }

  async signTokens(userId: string, email: string, name: string) {
    const payload = {
      sub: userId,
      email,
      name,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: '15m',
        secret: this.config.get('JWT_SECRET'),
      }),
      this.jwt.signAsync(payload, {
        expiresIn: '7d',
        secret: this.config.get('JWT_REFRESH_SECRET'),
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  async updateRefreshToken(userId: string, rt: string) {
    const hash = await argon.hash(rt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  async refreshTokens(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access Denied');

    const rtMatches = await argon.verify(user.refreshToken, rt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.signTokens(user.id, user.email, user.name ?? '');
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ─── OAuth ───────────────────────────────────────────────────────────────

  async oauthLogin(
    provider: 'google' | 'apple',
    profile: { id: string; email: string; name: string },
  ) {
    const whereClause =
      provider === 'google'
        ? { googleId: profile.id }
        : { appleId: profile.id };

    let user = await this.prisma.user.findFirst({ where: whereClause });

    if (!user) {
      // Check if email already exists (link accounts)
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // Link OAuth ID to existing account
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data:
            provider === 'google'
              ? { googleId: profile.id }
              : { appleId: profile.id },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            googleId: provider === 'google' ? profile.id : null,
            appleId: provider === 'apple' ? profile.id : null,
          },
        });
      }
    }

    const tokens = await this.signTokens(user.id, user.email, user.name ?? '');
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async verifyGoogleToken(idToken: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new ForbiddenException('Invalid Google token');
    return {
      id: payload.sub,
      email: payload.email ?? '',
      name: payload.name ?? payload.email ?? '',
    };
  }

  async verifyAppleToken(identityToken: string, fullName?: string) {
    const user = await AppleAuth.verifyIdToken(identityToken, {
      audience: this.config.get<string>('APPLE_CLIENT_ID'),
      ignoreExpiration: false,
    });
    return {
      id: user.sub,
      email: user.email ?? '',
      name: fullName ?? user.email ?? '',
    };
  }
}
