"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const argon = __importStar(require("argon2"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const amazon_s3_service_1 = require("../amazon-s3/amazon-s3.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
const apple_signin_auth_1 = __importDefault(require("apple-signin-auth"));
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    s3;
    constructor(prisma, jwt, config, s3) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.s3 = s3;
    }
    getHealthStatus() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'auth',
        };
    }
    async signup(signupDto) {
        try {
            const hash = await argon.hash(signupDto.password);
            const user = await this.prisma.user.create({
                data: {
                    email: signupDto.email,
                    hash,
                    name: signupDto.name,
                    profilePicture: signupDto.profilePicture || null,
                },
            });
            const tokens = await this.signTokens(user.id, user.email, user.name ?? '');
            await this.updateRefreshToken(user.id, tokens.refresh_token);
            return tokens;
        }
        catch (error) {
            console.error('Signup error:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error code:', error.code);
                console.error('Prisma error message:', error.message);
                if (error.code === 'P2002') {
                    throw new common_1.BadRequestException('Email already exists');
                }
            }
            throw error;
        }
    }
    async signin(singinDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: singinDto.email },
            });
            console.log(`Signed In User: ${user?.name}`);
            if (!user) {
                throw new common_1.ForbiddenException('Credentials Invalid');
            }
            if (!user.hash) {
                throw new common_1.ForbiddenException('Credentials Invalid');
            }
            const pwMatchs = await argon.verify(user.hash, singinDto.password);
            if (!pwMatchs) {
                throw new common_1.ForbiddenException('Credentials Invalid');
            }
            const tokens = await this.signTokens(user.id, user.email, user.name ?? '');
            await this.updateRefreshToken(user.id, tokens.refresh_token);
            return tokens;
        }
        catch (error) {
            console.error('Signin error:', error);
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Signin failed');
        }
    }
    async signTokens(userId, email, name) {
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
    async updateRefreshToken(userId, rt) {
        const hash = await argon.hash(rt);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hash },
        });
    }
    async refreshTokens(userId, rt) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.refreshToken)
            throw new common_1.ForbiddenException('Access Denied');
        const rtMatches = await argon.verify(user.refreshToken, rt);
        if (!rtMatches)
            throw new common_1.ForbiddenException('Access Denied');
        const tokens = await this.signTokens(user.id, user.email, user.name ?? '');
        await this.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
    async updateName(userId, name) {
        try {
            const updated = await this.prisma.user.update({
                where: { id: userId },
                data: { name },
            });
            const { hash: _, refreshToken: __, ...userWithoutSensitive } = updated;
            return userWithoutSensitive;
        }
        catch (error) {
            console.error('updateName error:', error);
            throw new common_1.InternalServerErrorException('Failed to update name');
        }
    }
    async changePassword(userId, previousPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.ForbiddenException('User not found');
        if (!user.hash)
            throw new common_1.BadRequestException('Account does not have a password');
        const matches = await argon.verify(user.hash, previousPassword);
        if (!matches)
            throw new common_1.ForbiddenException('Previous password does not match');
        const newHash = await argon.hash(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { hash: newHash },
        });
        return { success: true };
    }
    async updateEmail(userId, email) {
        try {
            const updated = await this.prisma.user.update({
                where: { id: userId },
                data: { email },
            });
            const { hash: _, refreshToken: __, ...userWithoutSensitive } = updated;
            return userWithoutSensitive;
        }
        catch (error) {
            console.error('updateEmail error:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.BadRequestException('Email already exists');
            }
            throw new common_1.InternalServerErrorException('Failed to update email');
        }
    }
    async getOrCreateProfilePicturePresignedUpload(userId, fileType = 'image/jpeg') {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.profilePicture) {
            const res = await this.s3.generatePresignedUploadUrlForKey(user.profilePicture, fileType);
            return {
                s3Key: res.s3Key,
                uploadUrl: res.uploadUrl,
                publicUrl: res.publicUrl,
            };
        }
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
    async getMeWithSubscriptions(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!user)
            throw new common_1.ForbiddenException('User not found');
        const { hash: _, refreshToken: __, ...userWithoutSensitiveFields } = user;
        return userWithoutSensitiveFields;
    }
    async oauthLogin(provider, profile) {
        const whereClause = provider === 'google'
            ? { googleId: profile.id }
            : { appleId: profile.id };
        let user = await this.prisma.user.findFirst({ where: whereClause });
        if (!user) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: profile.email },
            });
            if (existingUser) {
                user = await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: provider === 'google'
                        ? { googleId: profile.id }
                        : { appleId: profile.id },
                });
            }
            else {
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
    async verifyGoogleToken(idToken) {
        const clientIdRaw = this.config.get('GOOGLE_CLIENT_ID') ?? '';
        const clientIds = clientIdRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        const client = new google_auth_library_1.OAuth2Client();
        const audience = clientIds.length > 1 ? clientIds : clientIds[0];
        const ticket = await client.verifyIdToken({ idToken, audience });
        const payload = ticket.getPayload();
        if (!payload)
            throw new common_1.ForbiddenException('Invalid Google token');
        return {
            id: payload.sub,
            email: payload.email ?? '',
            name: payload.name ?? payload.email ?? '',
        };
    }
    async verifyAppleToken(identityToken, fullName) {
        const user = await apple_signin_auth_1.default.verifyIdToken(identityToken, {
            audience: this.config.get('APPLE_CLIENT_ID'),
            ignoreExpiration: false,
        });
        return {
            id: user.sub,
            email: user.email ?? '',
            name: fullName ?? user.email ?? '',
        };
    }
    async generateProfilePictureDownloadUrl(s3Key, expiresIn = 3600) {
        return this.s3.generatePresignedDownloadUrl(s3Key, expiresIn);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        amazon_s3_service_1.AmazonS3Service])
], AuthService);
//# sourceMappingURL=auth.service.js.map