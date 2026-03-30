import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyStyleDto {
  @ApiProperty({ description: 'S3 key of the image to take color palette and style from' })
  @IsString()
  @IsNotEmpty()
  sourceKey: string;

  @ApiProperty({ description: 'S3 key of the image to apply the style to (keep composition)' })
  @IsString()
  @IsNotEmpty()
  targetKey: string;

  @ApiProperty({ description: 'Optional description of the target location (e.g., Living Room)' })
  @IsString()
  @IsNotEmpty()
  location: string;
}
