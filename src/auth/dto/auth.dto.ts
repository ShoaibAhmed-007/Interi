import { IsNotEmpty, IsOptional, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Alice' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'secret', writeOnly: true })
  password: string;
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
