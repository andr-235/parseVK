import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  ClickHouseService,
  type CommentAnalytics,
  type AuthorStats,
  type TaskMetrics,
} from '../../clickhouse/clickhouse.service.js';
import { PrismaService } from '../../prisma.service.js';

interface SyncJob {
  type: 'incremental' | 'full';
  lastSyncTimestamp?: string;
}

interface TaskDescription {
  stats?: {
    groupsCount?: number;
    postsCount?: number;
    commentsCount?: number;
    authorsCount?: number;
  };
}

interface SyncResult {
  syncedAt: string;
  comments: number;
  authors: number;
  tasks: number;
}

/**
 * Форматирует дату в формат ClickHouse (YYYY-MM-DD HH:MM:SS)
 */
function formatDateForClickHouse(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

@Processor('sync', { concurrency: 1 })
export class ClickHouseSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ClickHouseSyncProcessor.name);
  private lastSyncTime: Date | null = null;

  constructor(
    private readonly clickhouseService: ClickHouseService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<SyncJob>): Promise<unknown> {
    if (job.name !== 'sync-clickhouse') {
      return;
    }

    this.logger.log(`Processing ClickHouse sync job: ${job.id}`);

    try {
      const { type } = job.data;

      if (type === 'incremental') {
        return await this.incrementalSync();
      } else if (type === 'full') {
        return await this.fullSync();
      }
    } catch (error) {
      this.logger.error('ClickHouse sync failed', error);
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
      const commentsData: CommentAnalytics[] = newComments
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
          created_at: formatDateForClickHouse(comment.createdAt),
        }));

      await this.clickhouseService.insertComments(commentsData);
    }

    // Синхронизация статистики авторов
    const authors = await this.prisma.author.findMany({
      where: {
        updatedAt: { gt: lastSync },
      },
      include: {
        comments: {
          select: {
            post: {
              select: {
                groupId: true,
              },
            },
          },
        },
      },
      take: 1000,
    });

    if (authors.length > 0) {
      const authorsData: AuthorStats[] = authors.map((author) => {
        const uniqueGroups = new Set(
          author.comments
            .map((c) => c.post.groupId)
            .filter((id): id is number => id !== null),
        );

        return {
          author_id: Number(author.id),
          author_vk_id: Number(author.vkUserId),
          author_name: `${author.firstName} ${author.lastName}`,
          total_comments: author.comments.length,
          groups_count: uniqueGroups.size,
          first_seen: formatDateForClickHouse(author.createdAt),
          last_seen: formatDateForClickHouse(author.updatedAt),
        };
      });

      await this.clickhouseService.insertAuthorStats(authorsData);
    }

    // Синхронизация метрик задач
    const tasks = await this.prisma.task.findMany({
      where: {
        updatedAt: { gt: lastSync },
      },
      take: 100,
    });

    if (tasks.length > 0) {
      const tasksData: TaskMetrics[] = tasks.map((task) => {
        let description: TaskDescription = {};
        if (typeof task.description === 'string') {
          try {
            description = JSON.parse(task.description) as TaskDescription;
          } catch {
            description = {};
          }
        } else if (task.description) {
          description = task.description as TaskDescription;
        }

        const completedAtString: string | null =
          task.completed && task.status === 'done'
            ? formatDateForClickHouse(task.updatedAt)
            : null;

        return {
          task_id: Number(task.id),
          status: task.status as 'pending' | 'running' | 'done' | 'failed',
          total_items: task.totalItems ?? 0,
          processed_items: task.processedItems ?? 0,
          progress: task.progress ?? 0,
          groups_count: description?.stats?.groupsCount ?? 0,
          posts_count: description?.stats?.postsCount ?? 0,
          comments_count: description?.stats?.commentsCount ?? 0,
          authors_count: description?.stats?.authorsCount ?? 0,
          created_at: formatDateForClickHouse(task.createdAt),
          updated_at: formatDateForClickHouse(task.updatedAt),
          completed_at: completedAtString,
        };
      });

      await this.clickhouseService.insertTaskMetrics(tasksData);
    }

    this.lastSyncTime = syncStartTime;

    return {
      syncedAt: syncStartTime.toISOString(),
      comments: newComments.length,
      authors: authors.length,
      tasks: tasks.length,
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
