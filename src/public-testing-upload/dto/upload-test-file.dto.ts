import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadTestFileDto {
  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the uploaded file (for testing).',
  })
  @IsString()
  @IsNotEmpty()
  fileType: string;
}
