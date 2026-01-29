import { Injectable, Logger } from '@nestjs/common';
import type { ParsingTaskJobData } from './interfaces/parsing-task-job.interface.js';
import { ParsingQueueProducer } from './queues/parsing.queue.js';

/**
 * Сервис-обертка над BullMQ очередью парсинга
 *
 * Предоставляет простой API для добавления и удаления задач.
 * Реальная обработка происходит в ParsingProcessor.
 *
 * МИГРАЦИЯ: Ранее использовалась in-memory очередь с последовательной обработкой.
 * Теперь используется BullMQ с параллельной обработкой (concurrency=2).
 */
@Injectable()
export class ParsingQueueService {
  private readonly logger = new Logger(ParsingQueueService.name);

  constructor(private readonly producer: ParsingQueueProducer) {}

  /**
   * Добавить задачу в очередь
   *
   * Задача будет обработана ParsingProcessor с учетом:
   * - VK API rate limits (через vk-io)
   * - BullMQ concurrency (максимум 2 задачи параллельно)
   * - Автоматический retry при ошибках (3 попытки)
   */
  async enqueue(job: ParsingTaskJobData): Promise<void> {
    await this.producer.enqueue(job);
    this.logger.log(
      `Задача ${job.taskId} добавлена в очередь (scope: ${job.scope}, groups: ${job.groupIds.length})`,
    );
  }

  /**
   * Удалить задачу из очереди
   *
   * Удаляет задачу из waiting/active/delayed состояний.
   * Если задача уже выполняется, она будет прервана.
   */
  async remove(taskId: number): Promise<void> {
    await this.producer.remove(taskId);
    this.logger.log(`Задача ${taskId} удалена из очереди`);
  }

  /**
   * Получить статистику очереди
   */
  async getStats() {
    return this.producer.getStats();
  }

  /**
   * Pause очередь (для тестирования/maintenance)
   */
  async pause(): Promise<void> {
    await this.producer.pause();
    this.logger.warn('Очередь парсинга приостановлена');
  }

  /**
   * Resume очередь
   */
  async resume(): Promise<void> {
    await this.producer.resume();
    this.logger.log('Очередь парсинга возобновлена');
  }
}
