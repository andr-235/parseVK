import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ResumeTaskCommand } from '../impl/resume-task.command.js';
import type { ITasksRepository } from '@/tasks/interfaces/tasks-repository.interface.js';
import type { TaskDetail } from '@/tasks/interfaces/task.interface.js';
import { ParsingQueueService } from '@/tasks/parsing-queue.service.js';
import { TaskMapper } from '@/tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '@/tasks/parsers/task-description.parser.js';
import { TaskContextBuilder } from '@/tasks/builders/task-context.builder.js';
import { TaskResumedEvent } from '@/tasks/events/index.js';
import type { TaskRecord } from '@/tasks/types/task-record.type.js';

@Injectable()
@CommandHandler(ResumeTaskCommand)
export class ResumeTaskHandler implements ICommandHandler<
  ResumeTaskCommand,
  TaskDetail
> {
  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
    private readonly parsingQueue: ParsingQueueService,
    private readonly eventBus: EventBus,
    private readonly taskMapper: TaskMapper,
    private readonly descriptionParser: TaskDescriptionParser,
    private readonly contextBuilder: TaskContextBuilder,
  ) {}

  async execute(command: ResumeTaskCommand): Promise<TaskDetail> {
    const task = await this.repository.findUnique({
      id: command.taskId,
    });

    if (!task) {
      throw new NotFoundException(`Задача с id=${command.taskId} не найдена`);
    }

    const taskRecord = task;
    const status = this.taskMapper.parseTaskStatus(taskRecord.status);
    if (status === 'done' || taskRecord.completed === true) {
      throw new BadRequestException('Задача уже завершена');
    }

    const context = await this.contextBuilder.buildResumeContext(taskRecord);

    const updatedTask = await this.repository.update(
      { id: command.taskId },
      {
        status: 'pending',
        completed: false,
        totalItems: context.totalItems,
        processedItems: context.processedItems,
        progress: context.progress,
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

    await this.parsingQueue.enqueue({
      taskId: task.id,
      scope: context.scope,
      groupIds: context.groupIds,
      postLimit: context.postLimit,
    });

    // Publish event
    this.eventBus.publish(new TaskResumedEvent(command.taskId, new Date()));

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
