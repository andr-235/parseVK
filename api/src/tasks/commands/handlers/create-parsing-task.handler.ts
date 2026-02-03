import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import {
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CreateParsingTaskCommand } from '../impl/create-parsing-task.command.js';
import type { ITasksRepository } from '@/tasks/interfaces/tasks-repository.interface.js';
import type { TaskDetail } from '@/tasks/interfaces/task.interface.js';
import { ParsingTaskRunner } from '@/tasks/parsing-task.runner.js';
import { ParsingQueueService } from '@/tasks/parsing-queue.service.js';
import { TaskMapper } from '@/tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '@/tasks/parsers/task-description.parser.js';
import { ParsingScope } from '@/tasks/dto/create-parsing-task.dto.js';
import { TaskCreatedEvent } from '@/tasks/events/index.js';
import { MetricsService } from '@/metrics/metrics.service.js';
import type { TaskRecord } from '@/tasks/types/task-record.type.js';

@Injectable()
@CommandHandler(CreateParsingTaskCommand)
export class CreateParsingTaskHandler implements ICommandHandler<
  CreateParsingTaskCommand,
  TaskDetail
> {
  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
    private readonly runner: ParsingTaskRunner,
    private readonly parsingQueue: ParsingQueueService,
    private readonly eventBus: EventBus,
    private readonly taskMapper: TaskMapper,
    private readonly descriptionParser: TaskDescriptionParser,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  async execute(command: CreateParsingTaskCommand): Promise<TaskDetail> {
    const scope =
      command.scope ??
      (command.groupIds?.length ? ParsingScope.SELECTED : ParsingScope.ALL);
    const postLimit = command.postLimit ?? 10;
    const groupIds = command.groupIds ?? [];

    // Validate groups exist
    const groups = await this.runner.resolveGroups(scope, groupIds);
    if (!groups.length) {
      throw new NotFoundException('Нет доступных групп для парсинга');
    }

    const totalItems = groups.length;

    // Create task in DB
    const task = await this.repository.create({
      title: this.runner.buildTaskTitle(scope, groups),
      description: JSON.stringify({ scope, groupIds, postLimit }),
      totalItems,
      processedItems: 0,
      progress: 0,
      status: 'pending',
    });

    this.metricsService?.recordTask('pending');

    // Enqueue job
    await this.parsingQueue.enqueue({
      taskId: task.id,
      scope,
      groupIds,
      postLimit,
    });

    // Publish event
    this.eventBus.publish(
      new TaskCreatedEvent(task.id, scope, groupIds, postLimit, task.createdAt),
    );

    return this.mapTaskToDetail(task);
  }

  private mapTaskToDetail(task: TaskRecord): TaskDetail {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToDetail(task, parsed, status);
  }
}
