import {
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty({ example: 'Alice' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @ApiProperty({ example: 'Secret123', writeOnly: true })
  password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    example: 'interior-app/abcd-1234.jpg',
    description: 'S3 key for profile picture',
  })
  profilePicture?: string;
}

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'secret', writeOnly: true })
  password: string;
}

export class GoogleOAuthDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'ya29.a0Af...' })
  idToken: string;
}

export class AppleOAuthDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'eyJhbGciOi...' })
  identityToken: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'Alice Smith' })
  fullName?: string;
}

export class UserDto {
  @ApiProperty({ example: 'e7b2a3c0-4f5d-6a7b-8c9d-0e1f2a3b4c5d' })
  id: string;
  @ApiProperty({ example: 'Alice' })
  name: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiProperty({ example: '2026-03-25T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 3 })
  freeTrialsLeft: number;

  @ApiProperty({ example: false })
  subscribed: boolean;

  @ApiProperty({ required: false, example: 'interior-app/abcd-1234.jpg' })
  profilePicture?: string | null;

  @ApiProperty({
    required: false,
    example: 'https://...amazonaws.com/interior-app/abcd-1234.jpg',
  })
  profilePicturePublicUrl?: string | null;
}

export class SubscriptionDetailsDto {
  @ApiProperty({ example: '9fd20f07-4a8c-41f0-b4b0-2f69a2650eb2' })
  id: string;

  @ApiProperty({ example: 'e7b2a3c0-4f5d-6a7b-8c9d-0e1f2a3b4c5d' })
  userId: string;

  @ApiProperty({ example: 50 })
  totalCredits: number;

  @ApiProperty({ example: 10 })
  usedCredits: number;

  @ApiProperty({ example: 40 })
  remainingCredits: number;

  @ApiProperty({ example: '2026-04-16T10:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2026-05-16T10:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: '2026-04-16T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({
    required: false,
    example: 'test_1776344832894_c21efa39-6974-41d8-9b0a-0796992a60cb',
  })
  transactionIdentifier?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class MeResponseDto extends UserDto {
  @ApiProperty({ type: [SubscriptionDetailsDto] })
  subscriptions: SubscriptionDetailsDto[];
}

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty({ example: 'Alice' })
  name: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'oldPassword', writeOnly: true })
  previousPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @ApiProperty({ example: 'NewSecret123', writeOnly: true })
  newPassword: string;
}

export class UpdateEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'alice.new@example.com' })
  email: string;
}

export class PresignedUploadResponse {
  @ApiProperty({ example: 'interior-app/abcd-1234.jpg' })
  s3Key: string;

  @ApiProperty({ example: 'https://signed-upload-url' })
  uploadUrl: string;

  @ApiProperty({
    example:
      'https://bucket.s3.region.amazonaws.com/interior-app/abcd-1234.jpg',
  })
  publicUrl: string;
}
