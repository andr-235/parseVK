import { Controller, Post, Get, Query, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ClickHouseService } from '../clickhouse/clickhouse.service.js';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service.js';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    @InjectQueue('sync') private syncQueue: Queue,
    private readonly clickhouseService: ClickHouseService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  /**
   * Запуск полной синхронизации вручную
   * POST /api/sync/full
   */
  @Post('full')
  async triggerFullSync() {
    this.logger.log('Manual full sync triggered');

    try {
      const clickhouseJob = await this.syncQueue.add(
        'sync-clickhouse',
        { type: 'full' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      const elasticsearchJob = await this.syncQueue.add(
        'sync-elasticsearch',
        { type: 'full' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      return {
        message: 'Full sync jobs created',
        jobs: {
          clickhouse: clickhouseJob.id,
          elasticsearch: elasticsearchJob.id,
        },
      };
    } catch (error) {
      this.logger.error('Failed to trigger full sync', error);
      throw error;
    }
  }

  /**
   * Запуск инкрементальной синхронизации вручную
   * POST /api/sync/incremental
   */
  @Post('incremental')
  async triggerIncrementalSync() {
    this.logger.log('Manual incremental sync triggered');

    try {
      const clickhouseJob = await this.syncQueue.add(
        'sync-clickhouse',
        { type: 'incremental' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      const elasticsearchJob = await this.syncQueue.add(
        'sync-elasticsearch',
        { type: 'incremental' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      return {
        message: 'Incremental sync jobs created',
        jobs: {
          clickhouse: clickhouseJob.id,
          elasticsearch: elasticsearchJob.id,
        },
      };
    } catch (error) {
      this.logger.error('Failed to trigger incremental sync', error);
      throw error;
    }
  }

  /**
   * Получение статуса очереди синхронизации
   * GET /api/sync/status
   */
  @Get('status')
  async getSyncStatus() {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.syncQueue.getWaitingCount(),
        this.syncQueue.getActiveCount(),
        this.syncQueue.getCompletedCount(),
        this.syncQueue.getFailedCount(),
      ]);

      // Проверка здоровья подключений
      const [clickhouseHealthy, elasticsearchHealthy] = await Promise.all([
        this.clickhouseService.ping(),
        this.elasticsearchService.ping(),
      ]);

      return {
        queue: {
          waiting,
          active,
          completed,
          failed,
        },
        health: {
          clickhouse: clickhouseHealthy ? 'healthy' : 'unhealthy',
          elasticsearch: elasticsearchHealthy ? 'healthy' : 'unhealthy',
        },
      };
    } catch (error) {
      this.logger.error('Failed to get sync status', error);
      throw error;
    }
  }

  /**
   * Получение последних jobs
   * GET /api/sync/jobs?limit=10
   */
  @Get('jobs')
  async getRecentJobs(@Query('limit') limit: string = '10') {
    try {
      const jobLimit = Math.min(parseInt(limit, 10) || 10, 100);

      const [completed, failed] = await Promise.all([
        this.syncQueue.getCompleted(0, jobLimit - 1),
        this.syncQueue.getFailed(0, jobLimit - 1),
      ]);

      return {
        completed: completed.map((job) => ({
          id: job.id,
          name: job.name,
          data: job.data as Record<string, unknown>,
          returnvalue: job.returnvalue as unknown,
          finishedOn: job.finishedOn,
        })),
        failed: failed.map((job) => ({
          id: job.id,
          name: job.name,
          data: job.data as Record<string, unknown>,
          failedReason: job.failedReason as string | undefined,
          finishedOn: job.finishedOn,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get recent jobs', error);
      throw error;
    }
  }

  /**
   * Очистка завершенных jobs
   * POST /api/sync/clean
   */
  @Post('clean')
  async cleanCompletedJobs() {
    try {
      await this.syncQueue.clean(0, 1000, 'completed');
      await this.syncQueue.clean(0, 1000, 'failed');

      return {
        message: 'Completed and failed jobs cleaned',
      };
    } catch (error) {
      this.logger.error('Failed to clean jobs', error);
      throw error;
    }
  }
}
