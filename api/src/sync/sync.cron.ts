import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SyncCron {
  private readonly logger = new Logger(SyncCron.name);

  constructor(@InjectQueue('sync') private syncQueue: Queue) {}

  /**
   * Синхронизация каждые 5 минут
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async triggerIncrementalSync() {
    this.logger.log('Triggering incremental sync');

    try {
      // Добавляем задачи в очередь
      await this.syncQueue.add(
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

      await this.syncQueue.add(
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

      this.logger.log('Incremental sync jobs added to queue');
    } catch (error) {
      this.logger.error('Failed to trigger sync', error);
    }
  }
}
