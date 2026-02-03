import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DeleteTaskCommand } from '../impl/delete-task.command.js';
import type { ITasksRepository } from '@/tasks/interfaces/tasks-repository.interface.js';
import { ParsingQueueService } from '@/tasks/parsing-queue.service.js';
import { TaskCancellationService } from '@/tasks/task-cancellation.service.js';
import { TaskDeletedEvent } from '@/tasks/events/index.js';

@Injectable()
@CommandHandler(DeleteTaskCommand)
export class DeleteTaskHandler implements ICommandHandler<
  DeleteTaskCommand,
  void
> {
  private readonly logger = new Logger(DeleteTaskHandler.name);

  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
    private readonly parsingQueue: ParsingQueueService,
    private readonly cancellationService: TaskCancellationService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTaskCommand): Promise<void> {
    const existing = await this.repository.findUnique({ id: command.taskId });
    if (!existing) {
      throw new NotFoundException(`Задача с id=${command.taskId} не найдена`);
    }

    this.cancellationService.requestCancel(command.taskId);

    let shouldClearCancellation = true;

    try {
      await this.parsingQueue.remove(command.taskId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('locked by another worker')
      ) {
        shouldClearCancellation = false;
        this.logger.warn(
          `Не удалось удалить задачу ${command.taskId} из очереди: ${error.message}. Работающее задание будет остановлено`,
        );
      } else {
        this.cancellationService.clear(command.taskId);
        throw error;
      }
    }

    await this.repository.delete({ id: command.taskId });

    if (shouldClearCancellation) {
      this.cancellationService.clear(command.taskId);
    }

    // Publish event
    this.eventBus.publish(new TaskDeletedEvent(command.taskId, new Date()));
  }
}
