import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateFromS3Dto {
  @ApiProperty({ description: 'S3 key of the source image', example: 'interior-app/originals/abc.jpg' })
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @ApiProperty({ description: 'Prompt describing desired changes', example: 'Make this a modern living room with warm tones' })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
