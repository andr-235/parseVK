import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  CreateParsingTaskDto,
  ParsingScope,
} from './dto/create-parsing-task.dto.js';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface.js';
import type { TaskDetail, TaskSummary } from './interfaces/task.interface.js';
import type { ITasksRepository } from './interfaces/tasks-repository.interface.js';
import { ParsingTaskRunner } from './parsing-task.runner.js';
import { ParsingQueueService } from './parsing-queue.service.js';
import { TaskCancellationService } from './task-cancellation.service.js';
import { TaskMapper } from './mappers/task.mapper.js';
import { TaskDescriptionParser } from './parsers/task-description.parser.js';
import { TaskContextBuilder } from './builders/task-context.builder.js';
import { MetricsService } from '../metrics/metrics.service.js';
import type { TaskRecord } from './types/task-record.type.js';

/**
 * Сервис для управления задачами парсинга VK групп
 *
 * Обеспечивает создание, выполнение и отслеживание задач парсинга,
 * включая обработку постов и комментариев из VK групп.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @Inject('ITasksRepository')
    private readonly repository: ITasksRepository,
    private readonly runner: ParsingTaskRunner,
    private readonly parsingQueue: ParsingQueueService,
    private readonly cancellationService: TaskCancellationService,
    private readonly taskMapper: TaskMapper,
    private readonly descriptionParser: TaskDescriptionParser,
    private readonly contextBuilder: TaskContextBuilder,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  /**
   * Создает новую задачу парсинга
   *
   * @param dto - DTO с параметрами задачи (scope, groupIds, postLimit)
   * @returns Результат создания задачи с деталями
   * @throws NotFoundException если нет доступных групп для парсинга
   */
  async createParsingTask(
    dto: CreateParsingTaskDto,
  ): Promise<ParsingTaskResult> {
    const scope =
      dto.scope ??
      (dto.groupIds?.length ? ParsingScope.SELECTED : ParsingScope.ALL);
    const postLimit = dto.postLimit ?? 10;
    const groupIds = dto.groupIds ?? [];

    const groups = await this.runner.resolveGroups(scope, groupIds);
    if (!groups.length) {
      throw new NotFoundException('Нет доступных групп для парсинга');
    }

    const totalItems = groups.length;

    const task = await this.repository.create({
      title: this.runner.buildTaskTitle(scope, groups),
      description: JSON.stringify({ scope, groupIds, postLimit }),
      totalItems,
      processedItems: 0,
      progress: 0,
      status: 'pending',
    });

    this.metricsService?.recordTask('pending');

    await this.parsingQueue.enqueue({
      taskId: task.id,
      scope,
      groupIds,
      postLimit,
    });

    return this.mapTaskToDetail(task);
  }

  /**
   * Получает список задач с пагинацией
   *
   * @param options - Опции пагинации (page, limit)
   * @returns Список задач с метаданными пагинации
   */
  async getTasks(options?: { page?: number; limit?: number }): Promise<{
    tasks: TaskSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const page = Math.max(options?.page ?? 1, 1);
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.repository.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.repository.count(),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const hasMore = page < totalPages;

    return {
      tasks: tasks.map((task) => this.mapTaskToSummary(task)),
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };
  }

  async getTask(taskId: number): Promise<TaskDetail> {
    const task = await this.repository.findUnique({
      id: taskId,
    });
    if (!task) {
      throw new NotFoundException(`Задача с id=${taskId} не найдена`);
    }
    return this.mapTaskToDetail(task);
  }

  async resumeTask(taskId: number): Promise<ParsingTaskResult> {
    const task = await this.repository.findUnique({
      id: taskId,
    });
    if (!task) {
      throw new NotFoundException(`Задача с id=${taskId} не найдена`);
    }

    const taskRecord = task;
    const status = this.taskMapper.parseTaskStatus(taskRecord.status);
    if (status === 'done' || taskRecord.completed === true) {
      throw new BadRequestException('Задача уже завершена');
    }

    const context = await this.contextBuilder.buildResumeContext(taskRecord);

    const updatedTask = await this.repository.update(
      { id: taskId },
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
      throw new NotFoundException(`Задача с id=${taskId} не найдена`);
    }

    await this.parsingQueue.enqueue({
      taskId: task.id,
      scope: context.scope,
      groupIds: context.groupIds,
      postLimit: context.postLimit,
    });

    return this.mapTaskToDetail(updatedTask);
  }

  async refreshTask(taskId: number): Promise<ParsingTaskResult> {
    const task = await this.repository.findUnique({
      id: taskId,
    });
    if (!task) {
      throw new NotFoundException(`Задача с id=${taskId} не найдена`);
    }

    const taskRecord = task;
    const context = await this.contextBuilder.buildResumeContext(taskRecord);
    const shouldComplete =
      context.totalItems > 0 && context.processedItems >= context.totalItems;

    const updatedTask = await this.repository.update(
      { id: taskId },
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
      throw new NotFoundException(`Задача с id=${taskId} не найдена`);
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

  async deleteTask(taskId: number): Promise<void> {
    const existing = await this.repository.findUnique({ id: taskId });
    if (!existing) {
      throw new NotFoundException(`Задача с id=${taskId} не найдена`);
    }

    this.cancellationService.requestCancel(taskId);

    let shouldClearCancellation = true;

    try {
      await this.parsingQueue.remove(taskId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('locked by another worker')
      ) {
        shouldClearCancellation = false;
        this.logger.warn(
          `Не удалось удалить задачу ${taskId} из очереди: ${error.message}. Работающее задание будет остановлено`,
        );
      } else {
        this.cancellationService.clear(taskId);
        throw error;
      }
    }

    await this.repository.delete({ id: taskId });

    if (shouldClearCancellation) {
      this.cancellationService.clear(taskId);
    }
  }

  private mapTaskToDetail(task: TaskRecord): TaskDetail {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToDetail(task, parsed, status);
  }

  private mapTaskToSummary(task: TaskRecord): TaskSummary {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToSummary(task, parsed, status);
  }
}
