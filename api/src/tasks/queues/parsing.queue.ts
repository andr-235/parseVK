import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { ParsingTaskJobData } from '../interfaces/parsing-task-job.interface.js';
import { PARSING_QUEUE, PARSING_RETRY_OPTIONS } from './parsing.constants.js';

/**
 * Сервис для управления очередью задач парсинга
 *
 * Использует BullMQ для:
 * - Персистентности задач в Redis
 * - Автоматического retry при ошибках
 * - Параллельной обработки (с учетом VK API rate limits)
 */
@Injectable()
export class ParsingQueueProducer {
  constructor(
    @InjectQueue(PARSING_QUEUE)
    private readonly queue: Queue<ParsingTaskJobData>,
  ) {}

  /**
   * Добавить задачу в очередь
   */
  async enqueue(data: ParsingTaskJobData): Promise<void> {
    await this.queue.add(
      'parse-task', // Job name
      data,
      {
        attempts: PARSING_RETRY_OPTIONS.attempts,
        backoff: PARSING_RETRY_OPTIONS.backoff,
        removeOnComplete: {
          age: 24 * 60 * 60, // Удалять завершенные задачи через 24 часа
          count: 100, // Хранить максимум 100 завершенных задач
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60, // Удалять failed задачи через 7 дней
        },
      },
    );
  }

  /**
   * Удалить задачу из очереди
   */
  async remove(taskId: number): Promise<void> {
    // Получаем все jobs с данным taskId
    const jobs = await this.queue.getJobs([
      'waiting',
      'active',
      'delayed',
      'paused',
    ]);

    for (const job of jobs) {
      if (job.data.taskId === taskId) {
        await job.remove();
      }
    }
  }

  /**
   * Получить статистику очереди
   */
  async getStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Очистить все задачи (для тестирования)
   */
  async clear(): Promise<void> {
    await this.queue.drain();
  }

  /**
   * Pause очередь
   */
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume очередь
   */
  async resume(): Promise<void> {
    await this.queue.resume();
  }
}
