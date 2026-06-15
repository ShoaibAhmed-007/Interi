import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
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
    private s3: AmazonS3Service,
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
          profilePicture: signupDto.profilePicture || null,
        },
      });

      // Return the tokens
      const tokens = await this.signTokens(
        user.id,
        user.email,
        user.name ?? '',
      );
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
      console.log(`Signed In User: ${user?.name}`);
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
      const tokens = await this.signTokens(
        user.id,
        user.email,
        user.name ?? '',
      );
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

  async updateName(userId: string, name: string) {
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { name },
      });
      const { hash: _, refreshToken: __, ...userWithoutSensitive } = updated;
      return userWithoutSensitive;
    } catch (error) {
      console.error('updateName error:', error);
      throw new InternalServerErrorException('Failed to update name');
    }
  }

  async changePassword(
    userId: string,
    previousPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');
    if (!user.hash)
      throw new BadRequestException('Account does not have a password');

    const matches = await argon.verify(user.hash, previousPassword);
    if (!matches)
      throw new ForbiddenException('Previous password does not match');

    const newHash = await argon.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hash: newHash },
    });
    return { success: true };
  }

  async updateEmail(userId: string, email: string) {
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { email },
      });
      const { hash: _, refreshToken: __, ...userWithoutSensitive } = updated;
      return userWithoutSensitive;
    } catch (error) {
      console.error('updateEmail error:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to update email');
    }
  }

  async getOrCreateProfilePicturePresignedUpload(
    userId: string,
    fileType = 'image/jpeg',
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // If user already has a profile picture key, generate upload URL for that key
    if (user.profilePicture) {
      const res = await this.s3.generatePresignedUploadUrlForKey(
        user.profilePicture,
        fileType,
      );
      return {
        s3Key: res.s3Key,
        uploadUrl: res.uploadUrl,
        publicUrl: res.publicUrl,
      };
    }

    // Otherwise create a new key, store it in DB and return URLs
    const created = await this.s3.generatePresignedUploadUrl(fileType);
    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePicture: created.s3Key },
    });
    return {
      s3Key: created.s3Key,
      uploadUrl: created.uploadUrl,
      publicUrl: created.publicUrl,
    };
  }

  async getMeWithSubscriptions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new ForbiddenException('User not found');

    const { hash: _, refreshToken: __, ...userWithoutSensitiveFields } = user;
    return userWithoutSensitiveFields;
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
    const clientIdRaw = this.config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientIds = clientIdRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const client = new OAuth2Client();
    const audience = clientIds.length > 1 ? clientIds : clientIds[0];
    const ticket = await client.verifyIdToken({ idToken, audience });
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

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { designHistories: true },
    });

    if (!user) throw new ForbiddenException('User not found');

    // Collect S3 keys to purge (profile picture + all design history images)
    const s3Keys: string[] = [];
    if (user.profilePicture) s3Keys.push(user.profilePicture);
    for (const h of user.designHistories) {
      if (h.originalImageKey && !h.originalImageKey.startsWith('http'))
        s3Keys.push(h.originalImageKey);
      if (h.resultImageKey && !h.resultImageKey.startsWith('http'))
        s3Keys.push(h.resultImageKey);
    }

    // Delete all related DB records then the user — order respects FK constraints
    await this.prisma.$transaction([
      this.prisma.designHistory.deleteMany({ where: { userId } }),
      this.prisma.favourite.deleteMany({ where: { userId } }),
      this.prisma.design.deleteMany({ where: { userId } }),
      this.prisma.subscription.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    // Best-effort S3 cleanup after DB records are gone
    await this.s3.deleteObjects(s3Keys);

    return { message: 'Account and all associated data deleted successfully' };
  }

  // Public wrapper to generate a presigned download URL for a profile picture key
  async generateProfilePictureDownloadUrl(
    s3Key: string,
    expiresIn = 3600,
  ): Promise<string> {
    return this.s3.generatePresignedDownloadUrl(s3Key, expiresIn);
  }
}
