import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import type { CommentsSearchClient } from '../comments-search.client.js';
import {
  COMMENTS_SEARCH_CLIENT,
  COMMENTS_SEARCH_CONFIG,
} from '../comments-search.constants.js';
import { CommentsSearchDocumentMapper } from '../mappers/comments-search-document.mapper.js';
import type { CommentsSearchConfig } from '../comments-search.types.js';

const indexCommentInclude = {
  author: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  post: {
    select: {
      text: true,
      group: {
        select: {
          vkId: true,
          name: true,
        },
      },
    },
  },
  commentKeywordMatches: {
    include: {
      keyword: {
        select: {
          id: true,
          word: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class CommentsSearchIndexerService {
  private readonly logger = new Logger(CommentsSearchIndexerService.name);

  constructor(
    @Inject(COMMENTS_SEARCH_CONFIG)
    private readonly config: CommentsSearchConfig,
    private readonly prisma: PrismaService,
    @Inject(COMMENTS_SEARCH_CLIENT)
    private readonly client: Pick<CommentsSearchClient, 'indexDocument'>,
    private readonly mapper: CommentsSearchDocumentMapper,
  ) {}

  async indexCommentById(commentId: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: indexCommentInclude,
    });

    if (!comment) {
      this.logger.warn(`Comment ${commentId} not found for search indexing`);
      return;
    }

    await this.client.indexDocument(String(comment.id), this.mapper.map(comment));
  }

  async indexCommentsByPost(ownerId: number, postId: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const comments = await this.prisma.comment.findMany({
      where: { ownerId, postId },
      select: { id: true },
    });

    for (const comment of comments) {
      await this.indexCommentById(comment.id);
    }
  }
}
