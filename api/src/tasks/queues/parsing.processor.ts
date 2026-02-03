import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Logger, Optional } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Job } from 'bullmq';
import { TasksGateway } from '../tasks.gateway.js';
import type { ParsingTaskJobData } from '../interfaces/parsing-task-job.interface.js';
import {
  PARSING_QUEUE,
  PARSING_CONCURRENCY,
  PARSING_JOB_TIMEOUT,
} from './parsing.constants.js';
import { TaskCancellationService } from '../task-cancellation.service.js';
import { TaskCancelledError } from '../errors/task-cancelled.error.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import type { IParsingTaskRepository } from '../interfaces/parsing-task-repository.interface.js';
import { ExecuteParsingTaskCommand } from '../commands/index.js';

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
    private readonly commandBus: CommandBus,
    @Inject('IParsingTaskRepository')
    private readonly repository: IParsingTaskRepository,
    private readonly tasksGateway: TasksGateway,
    private readonly cancellationService: TaskCancellationService,
    @Optional() private readonly metricsService?: MetricsService,
  ) {
    super();
  }

  async process(job: Job<ParsingTaskJobData>): Promise<void> {
    const { taskId, scope, groupIds, postLimit } = job.data;

    this.logger.log(
      `Начало обработки задачи ${taskId} (scope: ${scope}, groups: ${groupIds.length}, postLimit: ${postLimit})`,
    );

    let timeoutHandle: NodeJS.Timeout | null = null;

    try {
      // Обновляем статус на "running"
      await this.markStatus(taskId, 'running');

      // Выполняем парсинг через CommandBus
      const commandPromise = this.commandBus.execute(
        new ExecuteParsingTaskCommand(taskId, scope, groupIds, postLimit),
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          this.cancellationService.requestCancel(taskId);
          void commandPromise.catch(() => undefined);
          reject(
            new Error(
              `Задача ${taskId} превысила лимит времени выполнения (${PARSING_JOB_TIMEOUT}мс)`,
            ),
          );
        }, PARSING_JOB_TIMEOUT);

        if (timeoutHandle && typeof timeoutHandle.unref === 'function') {
          timeoutHandle.unref();
        }
      });

      // Выполняем парсинг
      await Promise.race([commandPromise, timeoutPromise]);

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
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
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
      const updatedTask = await this.repository.updateTaskStatus(
        taskId,
        status,
      );
      if (!updatedTask) {
        this.logger.warn(
          `Не удалось обновить статус задачи ${taskId} на ${status}: задача не найдена`,
        );
        return;
      }

      const payload = {
        id: taskId,
        status,
        completed:
          status === 'failed' ? false : (updatedTask.completed ?? false),
        totalItems: updatedTask.totalItems ?? null,
        processedItems: updatedTask.processedItems ?? null,
        description: updatedTask.description ?? null,
      } as const;

      this.tasksGateway.broadcastStatus(payload);
      this.tasksGateway.broadcastProgress(payload);

      this.metricsService?.recordTask(status);
    } catch (error) {
      this.logger.warn(
        `Не удалось обновить статус задачи ${taskId} на ${status}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
