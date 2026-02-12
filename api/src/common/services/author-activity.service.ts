import { Injectable } from '@nestjs/common';
import { AuthorsSaverService } from './authors-saver.service.js';
import { CommentsSaverService } from './comments-saver.service.js';
import type { CommentEntity } from '../types/comment-entity.type.js';
import type { KeywordMatchCandidate } from '../utils/keyword-normalization.utils.js';
import type { CommentSource } from '../types/comment-source.enum.js';

/**
 * Фасад для обратной совместимости.
 *
 * Делегирует в AuthorsSaverService и CommentsSaverService.
 * Новый код должен инжектировать нужный сервис напрямую.
 */
@Injectable()
export class AuthorActivityService {
  constructor(
    private readonly authorsSaver: AuthorsSaverService,
    private readonly commentsSaver: CommentsSaverService,
  ) {}

  refreshAllAuthors(batchSize?: number): Promise<number> {
    return this.authorsSaver.refreshAllAuthors(batchSize);
  }

  saveAuthors(userIds: number[]): Promise<number> {
    return this.authorsSaver.saveAuthors(userIds);
  }

  saveComments(
    comments: CommentEntity[],
    options: {
      source: CommentSource;
      watchlistAuthorId?: number | null;
      keywordMatches?: KeywordMatchCandidate[];
    },
  ): Promise<number> {
    return this.commentsSaver.saveComments(comments, options);
  }
}
