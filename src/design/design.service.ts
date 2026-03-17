import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignDto } from './dto/create-design.dto';

@Injectable()
export class DesignService {
  constructor(private prisma: PrismaService) {}

  async createDesign(userId: string, createDesignDto: CreateDesignDto) {
    const design = await this.prisma.design.create({
      data: {
        userId,
        category: createDesignDto.category,
        originalImageUrl: createDesignDto.originalImageUrl,
        resultImageUrl: createDesignDto.resultImageUrl,
        location: createDesignDto.location,
        style: createDesignDto.style,
        colorPalette: createDesignDto.colorPalette,
        seedUsed: createDesignDto.seedUsed,
      },
    });

    return design;
  }
}
