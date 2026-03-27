import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddFavouriteDto {
  @ApiProperty({ description: 'The ID of the design to favourite', example: 'uuid-of-design' })
  @IsString()
  @IsNotEmpty()
  designId: string;
}
