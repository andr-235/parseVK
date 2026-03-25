import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TelegramDlMatchService } from '../telegram-dl-match.service.js';
import {
  TELEGRAM_DL_MATCH_CONCURRENCY,
  TELEGRAM_DL_MATCH_QUEUE,
  type TelegramDlMatchJobData,
} from './telegram-dl-match.constants.js';

@Processor(TELEGRAM_DL_MATCH_QUEUE, {
  concurrency: TELEGRAM_DL_MATCH_CONCURRENCY,
})
export class TelegramDlMatchProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramDlMatchProcessor.name);

  constructor(private readonly service: TelegramDlMatchService) {
    super();
  }

  async process(job: Job<TelegramDlMatchJobData>): Promise<void> {
    this.logger.log(
      `Запуск worker DL match: jobId=${String(job.id)} runId=${job.data.runId}`,
    );

    await this.service.processRun(job.data.runId);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TelegramDlMatchJobData>) {
    this.logger.log(
      `DL match job завершен: jobId=${String(job.id)} runId=${job.data.runId}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TelegramDlMatchJobData> | undefined, error: Error) {
    if (!job) {
      this.logger.error(`DL match job failed without payload: ${error.message}`);
      return;
    }

    this.logger.error(
      `DL match job failed: jobId=${String(job.id)} runId=${job.data.runId} error=${error.message}`,
      error.stack,
    );
  }
}
