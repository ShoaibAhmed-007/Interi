import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { DesignHistoryService } from './design-history.service';

@ApiTags('design-history')
@Controller('design-history')
export class DesignHistoryController {
  constructor(private readonly designHistoryService: DesignHistoryService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get design history for the authenticated user', description: 'Returns designs created by the authenticated user in newest-first order, including creation time and original/final image URLs.' })
  @ApiOkResponse({
    description: 'Array of design history entries',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          originalImageUrl: { type: 'string', nullable: true },
          resultImageUrl: { type: 'string', nullable: true },
        },
      },
    },
  })
  async getHistory(@GetUser('id') userId: string) {
    const history = await this.designHistoryService.getUserDesignHistory(userId);
    return { success: true, data: history };
  }
}
