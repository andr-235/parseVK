import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { IAuthorService } from '../interfaces/photo-loader.interface';

@Injectable()
export class AuthorService implements IAuthorService {
  constructor(private readonly prisma: PrismaService) {}

  async findAuthorByVkId(vkUserId: number): Promise<{ id: number; vkUserId: number }> {
    const author = await this.prisma.author.findUnique({
      where: { vkUserId },
    });

    if (!author) {
      throw new NotFoundException(`Автор с vkUserId=${vkUserId} не найден`);
    }

    return author;
  }
}