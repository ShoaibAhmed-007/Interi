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
    signup(signupDto: SignUpDto): unknown;
    signin(singinDto: SignInDto): unknown;
    signTokens(userId: string, email: string, name: string): unknown;
    updateRefreshToken(userId: string, rt: string): any;
    refreshTokens(userId: string, rt: string): unknown;
    logout(userId: string): any;
    updateName(userId: string, name: string): unknown;
    changePassword(userId: string, previousPassword: string, newPassword: string): unknown;
    updateEmail(userId: string, email: string): unknown;
    getOrCreateProfilePicturePresignedUpload(userId: string, fileType?: string): unknown;
    oauthLogin(provider: 'google' | 'apple', profile: {
        id: string;
        email: string;
        name: string;
    }): unknown;
    verifyGoogleToken(idToken: string): unknown;
    verifyAppleToken(identityToken: string, fullName?: string): unknown;
    generateProfilePictureDownloadUrl(s3Key: string, expiresIn?: number): Promise<string>;
}
