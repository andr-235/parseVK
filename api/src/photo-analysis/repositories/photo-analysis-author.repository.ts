import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import type {
  IPhotoAnalysisAuthorRepository,
  PhotoAnalysisAuthorRecord,
} from '../interfaces/photo-analysis-author-repository.interface.js';

@Injectable()
export class PhotoAnalysisAuthorRepository implements IPhotoAnalysisAuthorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByVkId(vkUserId: number): Promise<PhotoAnalysisAuthorRecord | null> {
    return this.prisma.author.findUnique({
      where: { vkUserId },
      select: { id: true, vkUserId: true },
    });
  }
}
