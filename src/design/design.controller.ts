import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DesignService } from './design.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { GetUser } from '../auth/decorator/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('designs')
@Controller('designs')
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new design' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 201, description: 'Design created successfully' })
  @ApiBody({ type: CreateDesignDto })
  async createDesign(
    @GetUser('id') userId: string,
    @Body() createDesignDto: CreateDesignDto,
  ) {
    return this.designService.createDesign(userId, createDesignDto);
  }
}
