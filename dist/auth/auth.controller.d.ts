import { AuthService } from './auth.service';
import { SignInDto, SignUpDto, GoogleOAuthDto, AppleOAuthDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getHealth(): object;
    getMe(user: {
        name: string;
        email: string;
        createdAt: Date;
        freeTrialsLeft: number;
        subscribed: boolean;
    }): {
        name: string;
        email: string;
        createdAt: Date;
        freeTrialsLeft: number;
        subscribed: boolean;
    };
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
