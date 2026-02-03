import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RefreshTaskCommand } from '../impl/refresh-task.command.js';
import type { ITasksRepository } from '@/tasks/interfaces/tasks-repository.interface.js';
import type { TaskDetail } from '@/tasks/interfaces/task.interface.js';
import { ParsingQueueService } from '@/tasks/parsing-queue.service.js';
import { TaskMapper } from '@/tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '@/tasks/parsers/task-description.parser.js';
import { TaskContextBuilder } from '@/tasks/builders/task-context.builder.js';
import type { TaskRecord } from '@/tasks/types/task-record.type.js';

@Injectable()
@CommandHandler(RefreshTaskCommand)
export class RefreshTaskHandler implements ICommandHandler<
  RefreshTaskCommand,
  TaskDetail
> {
  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
    private readonly parsingQueue: ParsingQueueService,
    private readonly taskMapper: TaskMapper,
    private readonly descriptionParser: TaskDescriptionParser,
    private readonly contextBuilder: TaskContextBuilder,
  ) {}

  async execute(command: RefreshTaskCommand): Promise<TaskDetail> {
    const task = await this.repository.findUnique({
      id: command.taskId,
    });

    if (!task) {
      throw new NotFoundException(`Задача с id=${command.taskId} не найдена`);
    }

    const taskRecord = task;
    const context = await this.contextBuilder.buildResumeContext(taskRecord);
    const shouldComplete =
      context.totalItems > 0 && context.processedItems >= context.totalItems;

    const updatedTask = await this.repository.update(
      { id: command.taskId },
      {
        status: shouldComplete ? 'done' : 'pending',
        completed: shouldComplete,
        totalItems: context.totalItems,
        processedItems: context.processedItems,
        progress: shouldComplete ? 1 : context.progress,
        description: this.descriptionParser.stringify({
          scope: context.scope,
          groupIds: context.groupIds,
          postLimit: context.postLimit,
          stats: context.parsed.stats,
          skippedGroupsMessage: context.parsed.skippedGroupsMessage,
          skippedGroupIds: context.parsed.skippedGroupIds,
          current: taskRecord.description,
        }),
      },
    );

    if (!updatedTask) {
      throw new NotFoundException(`Задача с id=${command.taskId} не найдена`);
    }

    if (!shouldComplete) {
      await this.parsingQueue.enqueue({
        taskId: task.id,
        scope: context.scope,
        groupIds: context.groupIds,
        postLimit: context.postLimit,
      });
    }

    return this.mapTaskToDetail(updatedTask);
  }

  private mapTaskToDetail(task: TaskRecord): TaskDetail {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToDetail(task, parsed, status);
  }
}
