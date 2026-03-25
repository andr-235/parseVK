import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  TELEGRAM_DL_MATCH_JOB,
  TELEGRAM_DL_MATCH_QUEUE,
  TELEGRAM_DL_MATCH_RETRY_OPTIONS,
  type TelegramDlMatchJobData,
} from './telegram-dl-match.constants.js';

@Injectable()
export class TelegramDlMatchQueueProducer {
  constructor(
    @InjectQueue(TELEGRAM_DL_MATCH_QUEUE)
    private readonly queue: Queue<TelegramDlMatchJobData>,
  ) {}

  async enqueue(data: TelegramDlMatchJobData): Promise<void> {
    await this.queue.add(TELEGRAM_DL_MATCH_JOB, data, {
      attempts: TELEGRAM_DL_MATCH_RETRY_OPTIONS.attempts,
      backoff: TELEGRAM_DL_MATCH_RETRY_OPTIONS.backoff,
      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 100,
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60,
      },
    });
  }
}
