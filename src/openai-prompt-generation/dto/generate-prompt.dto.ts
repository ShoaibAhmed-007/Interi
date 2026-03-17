import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePromptDto {
  @ApiProperty({
    example: 'INTERIOR',
    description: 'Design category (e.g. INTERIOR, EXTERIOR, LANDSCAPE, NEW_FLOORING)',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example: 'Living Room',
    description: 'Specific room or area to be designed',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    example: 'Modern',
    description: 'Design style (e.g. Modern, Bohemian, Scandinavian)',
  })
  @IsString()
  @IsNotEmpty()
  style: string;

  @ApiProperty({
    example: 'Warm Neutrals',
    description: 'Colour palette (e.g. Warm Neutrals, High-Contrast, Pastel)',
  })
  @IsString()
  @IsNotEmpty()
  colorPalette: string;
}
