"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const get_user_decorator_1 = require("./decorator/get-user.decorator");
const amazon_s3_service_1 = require("../amazon-s3/amazon-s3.service");
const auth_dto_2 = require("./dto/auth.dto");
const swagger_1 = require("@nestjs/swagger");
let AuthController = class AuthController {
    authService;
    s3;
    constructor(authService, s3) {
        this.authService = authService;
        this.s3 = s3;
    }
    getHealth() {
        return this.authService.getHealthStatus();
    }
    async getMe(userId) {
        const user = await this.authService.getMeWithSubscriptions(userId);
        const now = new Date();
        let profilePublicUrl = null;
        if (user.profilePicture) {
            try {
                profilePublicUrl =
                    await this.authService.generateProfilePictureDownloadUrl(user.profilePicture);
            }
            catch (e) {
                profilePublicUrl = null;
            }
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            freeTrialsLeft: user.freeTrialsLeft,
            subscribed: user.subscribed,
            profilePicture: user.profilePicture || null,
            profilePicturePublicUrl: profilePublicUrl,
            subscriptions: user.subscriptions.map((subscription) => ({
                id: subscription.id,
                userId: subscription.userId,
                totalCredits: subscription.totalCredits,
                usedCredits: subscription.usedCredits,
                remainingCredits: Math.max(subscription.totalCredits - subscription.usedCredits, 0),
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                createdAt: subscription.createdAt,
                transactionIdentifier: subscription.transactionIdentifier,
                isActive: subscription.startDate <= now && subscription.endDate >= now,
            })),
        };
    }
    async updateName(userId, dto) {
        const updated = await this.authService.updateName(userId, dto.name);
        return { name: updated.name };
    }
    async updateEmail(userId, dto) {
        const updated = await this.authService.updateEmail(userId, dto.email);
        return { email: updated.email };
    }
    async changePassword(userId, dto) {
        return this.authService.changePassword(userId, dto.previousPassword, dto.newPassword);
    }
    async getPresignedProfileUploadUrl(userId, fileType) {
        const res = await this.authService.getOrCreateProfilePicturePresignedUpload(userId, fileType || 'image/jpeg');
        return {
            s3Key: res.s3Key,
            uploadUrl: res.uploadUrl,
            publicUrl: res.publicUrl,
        };
    }
    signup(signupDto) {
        return this.authService.signup(signupDto);
    }
    signin(signinDto) {
        return this.authService.signin(signinDto);
    }
    refreshTokens(userId, refreshToken) {
        return this.authService.refreshTokens(userId, refreshToken);
    }
    logout(userId) {
        return this.authService.logout(userId);
    }
    async googleOAuth(dto) {
        console.log('Google Requested');
        const profile = await this.authService.verifyGoogleToken(dto.idToken);
        return this.authService.oauthLogin('google', profile);
    }
    async appleOAuth(dto) {
        const profile = await this.authService.verifyAppleToken(dto.identityToken, dto.fullName);
        return this.authService.oauthLogin('apple', profile);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AuthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('/me'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user details' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns user details including subscription and profile picture info',
        type: auth_dto_2.MeResponseDto,
    }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)('/profile/name'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update authenticated user name' }),
    (0, swagger_1.ApiBody)({ type: auth_dto_2.UpdateNameDto }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_2.UpdateNameDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateName", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)('/profile/email'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update authenticated user email' }),
    (0, swagger_1.ApiBody)({ type: auth_dto_2.UpdateEmailDto }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_2.UpdateEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateEmail", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)('/profile/password'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Change password for authenticated user' }),
    (0, swagger_1.ApiBody)({ type: auth_dto_2.ChangePasswordDto }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_2.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Patch)('/profile/picture'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get S3 key and pre-signed upload URL for profile picture',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_dto_2.PresignedUploadResponse }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Query)('fileType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getPresignedProfileUploadUrl", null);
__decorate([
    (0, common_1.Post)('/signup'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User registered and tokens returned',
    }),
    (0, swagger_1.ApiBody)({ type: auth_dto_1.SignUpDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SignUpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('/signin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Sign in with email and password' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns access and refresh tokens',
    }),
    (0, swagger_1.ApiBody)({ type: auth_dto_1.SignInDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SignInDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signin", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt-refresh')),
    (0, common_1.Post)('/refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate tokens using refresh token' }),
    (0, swagger_1.ApiBearerAuth)('refresh-token'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New access and refresh tokens' }),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, get_user_decorator_1.GetUser)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('/logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate refresh token' }),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Refresh token invalidated' }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('/oauth/google'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Sign in via Google ID token' }),
    (0, swagger_1.ApiBody)({ type: auth_dto_1.GoogleOAuthDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.GoogleOAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleOAuth", null);
__decorate([
    (0, common_1.Post)('/oauth/apple'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Sign in via Apple identity token' }),
    (0, swagger_1.ApiBody)({ type: auth_dto_1.AppleOAuthDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.AppleOAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "appleOAuth", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        amazon_s3_service_1.AmazonS3Service])
], AuthController);
//# sourceMappingURL=auth.controller.js.map