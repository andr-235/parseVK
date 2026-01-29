import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IAuthorService } from '../interfaces/photo-loader.interface.js';
import type { IPhotoAnalysisAuthorRepository } from '../interfaces/photo-analysis-author-repository.interface.js';

@Injectable()
export class AuthorService implements IAuthorService {
  constructor(
    @Inject('IPhotoAnalysisAuthorRepository')
    private readonly repository: IPhotoAnalysisAuthorRepository,
  ) {}

  async findAuthorByVkId(
    vkUserId: number,
  ): Promise<{ id: number; vkUserId: number }> {
    const author = await this.repository.findByVkId(vkUserId);

    if (!author) {
      throw new NotFoundException(`Автор с vkUserId=${vkUserId} не найден`);
    }

    return author;
  }
}
