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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresignedUploadResponse = exports.UpdateEmailDto = exports.ChangePasswordDto = exports.UpdateNameDto = exports.MeResponseDto = exports.SubscriptionDetailsDto = exports.UserDto = exports.AppleOAuthDto = exports.GoogleOAuthDto = exports.SignInDto = exports.SignUpDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SignUpDto {
    name;
    email;
    password;
    profilePicture;
}
exports.SignUpDto = SignUpDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    (0, swagger_1.ApiProperty)({ example: 'Alice' }),
    __metadata("design:type", String)
], SignUpDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'alice@example.com' }),
    __metadata("design:type", String)
], SignUpDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.Matches)(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+/, {
        message: 'password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
    (0, swagger_1.ApiProperty)({ example: 'Secret123', writeOnly: true }),
    __metadata("design:type", String)
], SignUpDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 'interior-app/abcd-1234.jpg',
        description: 'S3 key for profile picture',
    }),
    __metadata("design:type", String)
], SignUpDto.prototype, "profilePicture", void 0);
class SignInDto {
    email;
    password;
}
exports.SignInDto = SignInDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'alice@example.com' }),
    __metadata("design:type", String)
], SignInDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'secret', writeOnly: true }),
    __metadata("design:type", String)
], SignInDto.prototype, "password", void 0);
class GoogleOAuthDto {
    idToken;
}
exports.GoogleOAuthDto = GoogleOAuthDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'ya29.a0Af...' }),
    __metadata("design:type", String)
], GoogleOAuthDto.prototype, "idToken", void 0);
class AppleOAuthDto {
    identityToken;
    fullName;
}
exports.AppleOAuthDto = AppleOAuthDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOi...' }),
    __metadata("design:type", String)
], AppleOAuthDto.prototype, "identityToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ required: false, example: 'Alice Smith' }),
    __metadata("design:type", String)
], AppleOAuthDto.prototype, "fullName", void 0);
class UserDto {
    id;
    name;
    email;
    createdAt;
    freeTrialsLeft;
    subscribed;
    profilePicture;
    profilePicturePublicUrl;
}
exports.UserDto = UserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e7b2a3c0-4f5d-6a7b-8c9d-0e1f2a3b4c5d' }),
    __metadata("design:type", String)
], UserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Alice' }),
    __metadata("design:type", String)
], UserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'alice@example.com' }),
    __metadata("design:type", String)
], UserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-03-25T12:00:00.000Z' }),
    __metadata("design:type", Date)
], UserDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], UserDto.prototype, "freeTrialsLeft", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], UserDto.prototype, "subscribed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'interior-app/abcd-1234.jpg' }),
    __metadata("design:type", Object)
], UserDto.prototype, "profilePicture", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 'https://...amazonaws.com/interior-app/abcd-1234.jpg',
    }),
    __metadata("design:type", Object)
], UserDto.prototype, "profilePicturePublicUrl", void 0);
class SubscriptionDetailsDto {
    id;
    userId;
    totalCredits;
    usedCredits;
    remainingCredits;
    startDate;
    endDate;
    createdAt;
    transactionIdentifier;
    isActive;
}
exports.SubscriptionDetailsDto = SubscriptionDetailsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '9fd20f07-4a8c-41f0-b4b0-2f69a2650eb2' }),
    __metadata("design:type", String)
], SubscriptionDetailsDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e7b2a3c0-4f5d-6a7b-8c9d-0e1f2a3b4c5d' }),
    __metadata("design:type", String)
], SubscriptionDetailsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    __metadata("design:type", Number)
], SubscriptionDetailsDto.prototype, "totalCredits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], SubscriptionDetailsDto.prototype, "usedCredits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 40 }),
    __metadata("design:type", Number)
], SubscriptionDetailsDto.prototype, "remainingCredits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-16T10:00:00.000Z' }),
    __metadata("design:type", Date)
], SubscriptionDetailsDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-16T10:00:00.000Z' }),
    __metadata("design:type", Date)
], SubscriptionDetailsDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-16T10:00:00.000Z' }),
    __metadata("design:type", Date)
], SubscriptionDetailsDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        example: 'test_1776344832894_c21efa39-6974-41d8-9b0a-0796992a60cb',
    }),
    __metadata("design:type", Object)
], SubscriptionDetailsDto.prototype, "transactionIdentifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], SubscriptionDetailsDto.prototype, "isActive", void 0);
class MeResponseDto extends UserDto {
    subscriptions;
}
exports.MeResponseDto = MeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SubscriptionDetailsDto] }),
    __metadata("design:type", Array)
], MeResponseDto.prototype, "subscriptions", void 0);
class UpdateNameDto {
    name;
}
exports.UpdateNameDto = UpdateNameDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    (0, swagger_1.ApiProperty)({ example: 'Alice' }),
    __metadata("design:type", String)
], UpdateNameDto.prototype, "name", void 0);
class ChangePasswordDto {
    previousPassword;
    newPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'oldPassword', writeOnly: true }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "previousPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.Matches)(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+/, {
        message: 'password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
    (0, swagger_1.ApiProperty)({ example: 'NewSecret123', writeOnly: true }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
class UpdateEmailDto {
    email;
}
exports.UpdateEmailDto = UpdateEmailDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'alice.new@example.com' }),
    __metadata("design:type", String)
], UpdateEmailDto.prototype, "email", void 0);
class PresignedUploadResponse {
    s3Key;
    uploadUrl;
    publicUrl;
}
exports.PresignedUploadResponse = PresignedUploadResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'interior-app/abcd-1234.jpg' }),
    __metadata("design:type", String)
], PresignedUploadResponse.prototype, "s3Key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://signed-upload-url' }),
    __metadata("design:type", String)
], PresignedUploadResponse.prototype, "uploadUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://bucket.s3.region.amazonaws.com/interior-app/abcd-1234.jpg',
    }),
    __metadata("design:type", String)
], PresignedUploadResponse.prototype, "publicUrl", void 0);
//# sourceMappingURL=auth.dto.js.map