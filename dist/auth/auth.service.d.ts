import { SignInDto, SignUpDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    getHealthStatus(): object;
    signup(signupDto: SignUpDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    signin(singinDto: SignInDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    signTokens(userId: string, email: string, name: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    updateRefreshToken(userId: string, rt: string): Promise<void>;
    refreshTokens(userId: string, rt: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(userId: string): Promise<void>;
    oauthLogin(provider: 'google' | 'apple', profile: {
        id: string;
        email: string;
        name: string;
    }): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    verifyGoogleToken(idToken: string): Promise<{
        id: string;
        email: string;
        name: string;
    }>;
    verifyAppleToken(identityToken: string, fullName?: string): Promise<{
        id: string;
        email: string;
        name: string;
    }>;
}
