import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Valid design categories
export enum DesignCategory {
  INTERIOR = 'INTERIOR',
  EXTERIOR = 'EXTERIOR',
  LANDSCAPE = 'LANDSCAPE',
  NEW_FLOORING = 'NEW_FLOORING',
}

export class CreateDesignDto {
  @ApiProperty({ enum: DesignCategory, example: DesignCategory.INTERIOR })
  @IsString()
  @IsNotEmpty()
  @IsEnum(DesignCategory, { message: 'category must be one of: INTERIOR, EXTERIOR, LANDSCAPE, NEW_FLOORING' })
  category: string;

  @ApiProperty({ example: 'https://example.com/original.jpg' })
  @IsString()
  @IsNotEmpty()
  originalImageUrl: string;

  @ApiPropertyOptional({ example: 'living room' })
  @IsString()
  @IsOptional()
  

  @ApiProperty({ example: 'Living Room' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'Modern' })
  @IsString()
  @IsNotEmpty()
  style: string;

  @ApiProperty({ example: 'High-Contrast' })
  @IsString()
  @IsNotEmpty()
  colorPalette: string;

  @ApiPropertyOptional({ type: 'number', example: null, description: 'Optional numeric seed used by the AI' })
  @IsOptional()
  @Transform(({ value }) => (value !== null && value !== undefined ? BigInt(value) : null))
  seedUsed?: bigint;
}
