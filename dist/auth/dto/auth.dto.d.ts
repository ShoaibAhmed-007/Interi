export declare class SignUpDto {
    name: string;
    email: string;
    password: string;
}
export declare class SignInDto {
    email: string;
    password: string;
}
export declare class GoogleOAuthDto {
    idToken: string;
}
export declare class AppleOAuthDto {
    identityToken: string;
    fullName?: string;
}
