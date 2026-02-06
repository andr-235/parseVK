import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  ElasticsearchService,
  type CommentDocument,
  type AuthorDocument,
} from '../../elasticsearch/elasticsearch.service.js';
import { PrismaService } from '../../prisma.service.js';

interface SyncJob {
  type: 'incremental' | 'full';
  lastSyncTimestamp?: string;
}

interface SyncResult {
  syncedAt: string;
  comments: number;
  authors: number;
}

@Processor('sync', { concurrency: 1 })
export class ElasticsearchSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ElasticsearchSyncProcessor.name);
  private lastSyncTime: Date | null = null;

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<SyncJob>): Promise<unknown> {
    if (job.name !== 'sync-elasticsearch') {
      return;
    }

    this.logger.log(`Processing Elasticsearch sync job: ${job.id}`);

    try {
      const { type } = job.data;

      if (type === 'incremental') {
        return await this.incrementalSync();
      } else if (type === 'full') {
        return await this.fullSync();
      }
    } catch (error) {
      this.logger.error('Elasticsearch sync failed', error);
      throw error;
    }
  }

  /**
   * Инкрементальная синхронизация - только новые/измененные записи
   */
  private async incrementalSync(): Promise<SyncResult> {
    const syncStartTime = new Date();
    const lastSync = this.lastSyncTime || new Date(0);

    this.logger.log(`Incremental sync from ${lastSync.toISOString()}`);

    // Синхронизация комментариев
    const newComments = await this.prisma.comment.findMany({
      where: {
        OR: [{ createdAt: { gt: lastSync } }, { updatedAt: { gt: lastSync } }],
      },
      include: {
        author: true,
        post: {
          include: {
            group: true,
          },
        },
      },
      take: 1000, // Порциями по 1000
    });

    if (newComments.length > 0) {
      const commentsData: CommentDocument[] = newComments
        .filter((comment) => comment.author !== null)
        .map((comment) => ({
          id: Number(comment.id),
          vk_comment_id: Number(comment.vkCommentId),
          vk_owner_id: Number(comment.ownerId),
          text: comment.text,
          post_id: Number(comment.post.id),
          author_id: Number(comment.author!.id),
          author_vk_id: Number(comment.author!.vkUserId),
          author_name: `${comment.author!.firstName} ${comment.author!.lastName}`,
          group_id: comment.post.groupId ? Number(comment.post.groupId) : null,
          group_name: comment.post.group?.name ?? '',
          task_id: null,
          source: comment.source as 'TASK' | 'WATCHLIST',
          created_at: comment.createdAt,
        }));

      await this.elasticsearchService.indexComments(commentsData);
    }

    // Синхронизация авторов
    const authors = await this.prisma.author.findMany({
      where: {
        updatedAt: { gt: lastSync },
      },
      include: {
        _count: {
          select: { comments: true },
        },
      },
      take: 1000,
    });

    if (authors.length > 0) {
      const authorsData: AuthorDocument[] = authors.map((author) => ({
        id: Number(author.id),
        vk_id: Number(author.vkUserId),
        name: `${author.firstName} ${author.lastName}`,
        screen_name: author.screenName ?? '',
        total_comments: author._count.comments,
        last_seen: author.updatedAt,
      }));

      await this.elasticsearchService.indexAuthors(authorsData);
    }

    this.lastSyncTime = syncStartTime;

    return {
      syncedAt: syncStartTime.toISOString(),
      comments: newComments.length,
      authors: authors.length,
    };
  }

  /**
   * Полная синхронизация - все данные
   */
  private async fullSync(): Promise<SyncResult> {
    this.logger.log('Starting full sync');

    // Для полной синхронизации сбрасываем время последней синхронизации
    this.lastSyncTime = new Date(0);

    return await this.incrementalSync();
  }
}
