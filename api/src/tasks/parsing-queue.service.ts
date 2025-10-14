import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { ParsingTaskJobData } from './interfaces/parsing-task-job.interface';
import { ParsingTaskRunner } from './parsing-task.runner';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class ParsingQueueService {
  private readonly logger = new Logger(ParsingQueueService.name);
  private readonly queue: ParsingTaskJobData[] = [];
  private processing = false;

  constructor(
    private readonly runner: ParsingTaskRunner,
    private readonly prisma: PrismaService,
    private readonly tasksGateway: TasksGateway,
  ) {}

  async enqueue(job: ParsingTaskJobData): Promise<void> {
    this.queue.push(job);
    this.schedule();
  }

  async remove(taskId: number): Promise<void> {
    if (!this.queue.length) {
      return;
    }

    for (let index = this.queue.length - 1; index >= 0; index -= 1) {
      if (this.queue[index]?.taskId === taskId) {
        this.queue.splice(index, 1);
      }
    }
  }

  private schedule(): void {
    if (!this.processing) {
      this.processing = true;
      void this.processNext();
    }
  }

  private async processNext(): Promise<void> {
    const job = this.queue.shift();

    if (!job) {
      this.processing = false;
      return;
    }

    try {
      await this.markStatus(job.taskId, 'running');
      await this.runner.execute(job);
    } catch (error) {
      await this.markStatus(job.taskId, 'failed');
      this.logger.error(
        `Не удалось обработать задание ${job.taskId}: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      await this.processNext();
    }
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
        completed: status === 'failed' ? false : updatedTask.completed ?? false,
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
