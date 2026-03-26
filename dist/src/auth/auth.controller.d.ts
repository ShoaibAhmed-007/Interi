import { AuthService } from './auth.service';
import { SignInDto, SignUpDto, GoogleOAuthDto, AppleOAuthDto } from './dto/auth.dto';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
import { UpdateNameDto, ChangePasswordDto, UpdateEmailDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    private readonly s3;
    constructor(authService: AuthService, s3: AmazonS3Service);
    getHealth(): object;
    getMe(user: any): Promise<{
        name: any;
        email: any;
        createdAt: any;
        freeTrialsLeft: any;
        subscribed: any;
        profilePicture: any;
        profilePicturePublicUrl: string | null;
    }>;
    updateName(userId: string, dto: UpdateNameDto): Promise<{
        name: string | null;
    }>;
    updateEmail(userId: string, dto: UpdateEmailDto): Promise<{
        email: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    getPresignedProfileUploadUrl(userId: string, fileType?: string): Promise<{
        s3Key: string;
        uploadUrl: string;
        publicUrl: string;
    }>;
    signup(signupDto: SignUpDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    signin(signinDto: SignInDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(userId: string): Promise<void>;
    googleOAuth(dto: GoogleOAuthDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    appleOAuth(dto: AppleOAuthDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
}
