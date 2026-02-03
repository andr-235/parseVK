import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateTaskProgressCommand } from '../impl/update-task-progress.command.js';
import type { IParsingTaskRepository } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import { TaskCancellationService } from '@/tasks/task-cancellation.service.js';
import { TaskProgressUpdatedEvent } from '@/tasks/events/index.js';

@Injectable()
@CommandHandler(UpdateTaskProgressCommand)
export class UpdateTaskProgressHandler implements ICommandHandler<
  UpdateTaskProgressCommand,
  void
> {
  constructor(
    @Inject('IParsingTaskRepository')
    private readonly repository: IParsingTaskRepository,
    private readonly eventBus: EventBus,
    private readonly cancellationService: TaskCancellationService,
  ) {}

  async execute(command: UpdateTaskProgressCommand): Promise<void> {
    const { taskId, processedItems, progress, status, stats } = command;

    this.cancellationService.throwIfCancelled(taskId);

    const updatedTask = await this.repository.updateTask(taskId, {
      processedItems,
      progress,
      status,
    });

    if (!updatedTask) {
      throw new NotFoundException(`Задача ${taskId} не найдена`);
    }

    // Publish progress event
    this.eventBus.publish(
      new TaskProgressUpdatedEvent(taskId, processedItems, progress, stats),
    );
  }
}
