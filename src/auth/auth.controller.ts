import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
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
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  getHealth(): object {
    return this.authService.getHealthStatus();
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
