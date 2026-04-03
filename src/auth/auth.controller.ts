import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  SignInDto,
  SignUpDto,
  GoogleOAuthDto,
  AppleOAuthDto,
} from './dto/auth.dto';
import { GetUser } from './decorator/get-user.decorator';
import { AmazonS3Service } from '../amazon-s3/amazon-s3.service';
import { UserDto } from './dto/auth.dto';
import { UpdateNameDto, ChangePasswordDto, PresignedUploadResponse, UpdateEmailDto } from './dto/auth.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly s3: AmazonS3Service) {}

  @Get('health')
  getHealth(): object {
    return this.authService.getHealthStatus();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user details' })
  @ApiResponse({ status: 200, description: 'Returns user details including profile picture info', type: UserDto })
  async getMe(
    @GetUser()
    user: any,
  ) {
    let profilePublicUrl: string | null = null;
    if (user.profilePicture) {
      try {
        profilePublicUrl = await this.authService.generateProfilePictureDownloadUrl(user.profilePicture);
      } catch (e) {
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
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/profile/name')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update authenticated user name' })
  @ApiBody({ type: UpdateNameDto })
  async updateName(@GetUser('id') userId: string, @Body() dto: UpdateNameDto) {
    const updated = await this.authService.updateName(userId, dto.name);
    return { name: updated.name };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/profile/email')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update authenticated user email' })
  @ApiBody({ type: UpdateEmailDto })
  async updateEmail(@GetUser('id') userId: string, @Body() dto: UpdateEmailDto) {
    const updated = await this.authService.updateEmail(userId, dto.email);
    return { email: updated.email };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/profile/password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@GetUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.previousPassword, dto.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/profile/picture')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get S3 key and pre-signed upload URL for profile picture' })
  @ApiResponse({ status: 200, type: PresignedUploadResponse })
  async getPresignedProfileUploadUrl(@GetUser('id') userId: string, @Query('fileType') fileType?: string) {
    const res = await this.authService.getOrCreateProfilePicturePresignedUpload(userId, fileType || 'image/jpeg');
    return { s3Key: res.s3Key, uploadUrl: res.uploadUrl, publicUrl: res.publicUrl };
  }

  @Post('/signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered and tokens returned' })
  @ApiBody({ type: SignUpDto })
  signup(@Body() signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }

  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Returns access and refresh tokens' })
  @ApiBody({ type: SignInDto })
  signin(@Body() signinDto: SignInDto) {
    return this.authService.signin(signinDto);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate tokens using refresh token' })
  @ApiBearerAuth('refresh-token')
  @ApiResponse({ status: 200, description: 'New access and refresh tokens' })
  refreshTokens(
    @GetUser('sub') userId: string,
    @GetUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Refresh token invalidated' })
  logout(@GetUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Post('/oauth/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in via Google ID token' })
  @ApiBody({ type: GoogleOAuthDto })
  async googleOAuth(@Body() dto: GoogleOAuthDto) {
    console.log('Google Requested');
    const profile = await this.authService.verifyGoogleToken(dto.idToken);
    return this.authService.oauthLogin('google', profile);
  }

  @Post('/oauth/apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in via Apple identity token' })
  @ApiBody({ type: AppleOAuthDto })
  async appleOAuth(@Body() dto: AppleOAuthDto) {
    const profile = await this.authService.verifyAppleToken(
      dto.identityToken,
      dto.fullName,
    );
    return this.authService.oauthLogin('apple', profile);
  }
}
