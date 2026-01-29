import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommentSource } from '../../common/types/comment-source.enum.js';
import type { WatchlistAuthorWithRelations } from '../interfaces/watchlist-repository.interface.js';
import type { CommentEntity } from '../../common/types/comment-entity.type.js';
import { AuthorActivityService } from '../../common/services/author-activity.service.js';
import { VkService } from '../../vk/vk.service.js';
import { normalizeComment } from '../../common/utils/comment-normalizer.utils.js';
import {
  composeCommentKey,
  walkCommentTree,
} from '../utils/watchlist-comment.utils.js';
import type { IWatchlistRepository } from '../interfaces/watchlist-repository.interface.js';

@Injectable()
export class WatchlistAuthorRefresherService {
  private readonly logger = new Logger(WatchlistAuthorRefresherService.name);

  constructor(
    @Inject('IWatchlistRepository')
    private readonly repository: IWatchlistRepository,
    private readonly authorActivityService: AuthorActivityService,
    private readonly vkService: VkService,
  ) {}

  async refreshAuthorRecord(
    record: WatchlistAuthorWithRelations,
  ): Promise<number> {
    const checkTimestamp = new Date();

    let newComments = 0;
    let latestActivity: Date | null = record.lastActivityAt ?? null;

    try {
      const trackedPosts = await this.repository.getTrackedPosts(
        record.id,
        record.authorVkId,
      );

      if (!trackedPosts.length) {
        return 0;
      }

      const existingKeys = await this.repository.loadExistingCommentKeys(
        record.id,
        record.authorVkId,
      );
      const baseline = record.lastActivityAt ?? null;

      for (const post of trackedPosts) {
        const { addedCount, maxActivity } = await this.processAuthorPost(
          record,
          post,
          baseline,
          existingKeys,
        );

        newComments += addedCount;

        if (maxActivity && (!latestActivity || maxActivity > latestActivity)) {
          latestActivity = maxActivity;
        }
      }

      if (newComments > 0) {
        this.logger.log(
          `Мониторинг автора ${record.authorVkId}: найдено ${newComments} новых комментариев`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Ошибка обновления автора ${record.authorVkId} в списке "На карандаше"`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      const updateData = {
        lastCheckedAt: checkTimestamp,
        ...(newComments > 0
          ? { incrementFoundCommentsCount: newComments }
          : {}),
        ...(latestActivity &&
        (!record.lastActivityAt || latestActivity > record.lastActivityAt)
          ? { lastActivityAt: latestActivity }
          : {}),
      };

      await this.repository.update(record.id, updateData);
    }

    return newComments;
  }

  private async processAuthorPost(
    record: WatchlistAuthorWithRelations,
    post: { ownerId: number; postId: number },
    baseline: Date | null,
    existingKeys: Set<string>,
  ): Promise<{ addedCount: number; maxActivity: Date | null }> {
    const comments = await this.fetchAuthorCommentsForPost(
      post.ownerId,
      post.postId,
      record.authorVkId,
      baseline,
    );

    if (!comments.length) {
      return { addedCount: 0, maxActivity: null };
    }

    await this.authorActivityService.saveComments(comments, {
      source: CommentSource.WATCHLIST,
      watchlistAuthorId: record.id,
    });

    let addedCount = 0;
    let maxActivity: Date | null = null;

    for (const comment of comments) {
      walkCommentTree(comment, (entity) => {
        if (!maxActivity || entity.publishedAt > maxActivity) {
          maxActivity = entity.publishedAt;
        }

        const key = composeCommentKey(entity.ownerId, entity.vkCommentId);

        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          addedCount += 1;
        }
      });
    }

    return { addedCount, maxActivity };
  }

  private async fetchAuthorCommentsForPost(
    ownerId: number,
    postId: number,
    authorVkId: number,
    baseline: Date | null,
  ): Promise<CommentEntity[]> {
    const comments = await this.vkService.getAuthorCommentsForPost({
      ownerId,
      postId,
      authorVkId,
      baseline,
      batchSize: 100,
      maxPages: 5,
      threadItemsCount: 10,
    });

    if (!comments.length) {
      return [];
    }

    return comments.map((item) => normalizeComment(item));
  }
}
