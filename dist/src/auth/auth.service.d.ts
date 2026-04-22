import { SignInDto, SignUpDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private s3;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, s3: AmazonS3Service);
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
    updateName(userId: string, name: string): Promise<{
        name: string | null;
        email: string;
        profilePicture: string | null;
        id: string;
        createdAt: Date;
        freeTrialsLeft: number;
        subscribed: boolean;
        googleId: string | null;
        appleId: string | null;
        updatedAt: Date;
    }>;
    changePassword(userId: string, previousPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    updateEmail(userId: string, email: string): Promise<{
        name: string | null;
        email: string;
        profilePicture: string | null;
        id: string;
        createdAt: Date;
        freeTrialsLeft: number;
        subscribed: boolean;
        googleId: string | null;
        appleId: string | null;
        updatedAt: Date;
    }>;
    getOrCreateProfilePicturePresignedUpload(userId: string, fileType?: string): Promise<{
        s3Key: string;
        uploadUrl: string;
        publicUrl: string;
    }>;
    getMeWithSubscriptions(userId: string): Promise<{
        subscriptions: {
            id: string;
            createdAt: Date;
            userId: string;
            totalCredits: number;
            usedCredits: number;
            startDate: Date;
            endDate: Date;
            transactionIdentifier: string | null;
        }[];
        name: string | null;
        email: string;
        profilePicture: string | null;
        id: string;
        createdAt: Date;
        freeTrialsLeft: number;
        subscribed: boolean;
        googleId: string | null;
        appleId: string | null;
        updatedAt: Date;
    }>;
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
    generateProfilePictureDownloadUrl(s3Key: string, expiresIn?: number): Promise<string>;
}
