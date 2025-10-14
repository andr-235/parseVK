import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { ParsingTaskRunner } from '../parsing-task.runner';
import { TasksGateway } from '../tasks.gateway';
import type { ParsingTaskJobData } from '../interfaces/parsing-task-job.interface';
import { PARSING_QUEUE, PARSING_CONCURRENCY } from './parsing.constants';
import { TaskCancellationService } from '../task-cancellation.service';
import { TaskCancelledError } from '../errors/task-cancelled.error';

/**
 * Worker для обработки задач парсинга
 *
 * ВАЖНО: Concurrency = 2 (см. parsing.constants.ts)
 * - Обрабатываем максимум 2 задачи параллельно
 * - vk-io управляет VK API rate limits внутри каждой задачи
 * - Это балансирует скорость и соблюдение rate limits
 */
@Processor(PARSING_QUEUE, {
  concurrency: PARSING_CONCURRENCY,
})
export class ParsingProcessor extends WorkerHost {
  private readonly logger = new Logger(ParsingProcessor.name);

  constructor(
    private readonly runner: ParsingTaskRunner,
    private readonly prisma: PrismaService,
    private readonly tasksGateway: TasksGateway,
    private readonly cancellationService: TaskCancellationService,
  ) {
    super();
  }

  async process(job: Job<ParsingTaskJobData>): Promise<void> {
    const { taskId, scope, groupIds, postLimit } = job.data;

    this.logger.log(
      `Начало обработки задачи ${taskId} (scope: ${scope}, groups: ${groupIds.length}, postLimit: ${postLimit})`,
    );

    try {
      // Обновляем статус на "running"
      await this.markStatus(taskId, 'running');

      // Выполняем парсинг
      await this.runner.execute(job.data);

      this.logger.log(`Задача ${taskId} успешно завершена`);
    } catch (error) {
      if (error instanceof TaskCancelledError) {
        this.logger.warn(`Задача ${taskId} была отменена пользователем`);
        return;
      }

      // Обновляем статус на "failed"
      await this.markStatus(taskId, 'failed');

      this.logger.error(
        `Ошибка при обработке задачи ${taskId}: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error; // BullMQ обработает retry
    } finally {
      this.cancellationService.clear(taskId);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job<ParsingTaskJobData>) {
    this.logger.debug(
      `Job ${job.id} is now active. TaskId: ${job.data.taskId}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ParsingTaskJobData>) {
    this.logger.log(`Job ${job.id} completed. TaskId: ${job.data.taskId}`);
    this.cancellationService.clear(job.data.taskId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ParsingTaskJobData> | undefined, error: Error) {
    if (job) {
      this.logger.error(
        `Job ${job.id} failed. TaskId: ${job.data.taskId}. Error: ${error.message}`,
      );
      this.cancellationService.clear(job.data.taskId);
    } else {
      this.logger.error(`Job failed without job data. Error: ${error.message}`);
    }
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker error: ${error.message}`, error.stack);
  }

  private async markStatus(
    taskId: number,
    status: 'running' | 'failed',
  ): Promise<void> {
    try {
      const updatedTask = await this.prisma.task.update({
        where: { id: taskId },
        data: { status } as Prisma.TaskUncheckedUpdateInput,
      });

      const payload = {
        id: taskId,
        status,
        completed:
          status === 'failed' ? false : (updatedTask.completed ?? false),
        totalItems: updatedTask.totalItems ?? null,
        processedItems: updatedTask.processedItems ?? null,
        progress: updatedTask.progress ?? null,
        description: updatedTask.description ?? null,
      } as const;

      this.tasksGateway.broadcastStatus(payload);
      this.tasksGateway.broadcastProgress(payload);
    } catch (error) {
      this.logger.warn(
        `Не удалось обновить статус задачи ${taskId} на ${status}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
