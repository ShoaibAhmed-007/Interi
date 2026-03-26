export declare class SignUpDto {
    name: string;
    email: string;
    password: string;
    profilePicture?: string;
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
export declare class UserDto {
    name: string;
    email: string;
    createdAt: Date;
    freeTrialsLeft: number;
    subscribed: boolean;
    profilePicture?: string | null;
    profilePicturePublicUrl?: string | null;
}
export declare class UpdateNameDto {
    name: string;
}
export declare class ChangePasswordDto {
    previousPassword: string;
    newPassword: string;
}
export declare class UpdateEmailDto {
    email: string;
}
export declare class PresignedUploadResponse {
    s3Key: string;
    uploadUrl: string;
    publicUrl: string;
}
