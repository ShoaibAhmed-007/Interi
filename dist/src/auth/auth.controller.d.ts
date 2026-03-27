import { AuthService } from './auth.service';
import { SignInDto, SignUpDto, GoogleOAuthDto, AppleOAuthDto } from './dto/auth.dto';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
import { UpdateNameDto, ChangePasswordDto, UpdateEmailDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    private readonly s3;
    constructor(authService: AuthService, s3: AmazonS3Service);
    getHealth(): object;
    getMe(user: any): unknown;
    updateName(userId: string, dto: UpdateNameDto): unknown;
    updateEmail(userId: string, dto: UpdateEmailDto): unknown;
    changePassword(userId: string, dto: ChangePasswordDto): unknown;
    getPresignedProfileUploadUrl(userId: string, fileType?: string): unknown;
    signup(signupDto: SignUpDto): unknown;
    signin(signinDto: SignInDto): unknown;
    refreshTokens(userId: string, refreshToken: string): unknown;
    logout(userId: string): any;
    googleOAuth(dto: GoogleOAuthDto): unknown;
    appleOAuth(dto: AppleOAuthDto): unknown;
}
