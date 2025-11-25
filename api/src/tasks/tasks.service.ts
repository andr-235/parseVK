import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  CreateParsingTaskDto,
  ParsingScope,
} from './dto/create-parsing-task.dto';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface';
import type {
  TaskDetail,
  TaskSummary,
} from './interfaces/task.interface';
import { ParsingTaskRunner } from './parsing-task.runner';
import { ParsingQueueService } from './parsing-queue.service';
import { TaskCancellationService } from './task-cancellation.service';
import { TaskMapper } from './mappers/task.mapper';
import { TaskDescriptionParser } from './parsers/task-description.parser';
import { TaskContextBuilder } from './builders/task-context.builder';
import type { PrismaTaskRecord } from './mappers/task.mapper';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: ParsingTaskRunner,
    private readonly parsingQueue: ParsingQueueService,
    private readonly cancellationService: TaskCancellationService,
    private readonly taskMapper: TaskMapper,
    private readonly descriptionParser: TaskDescriptionParser,
    private readonly contextBuilder: TaskContextBuilder,
  ) {}

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

    const task = (await this.prisma.task.create({
      data: {
        title: this.runner.buildTaskTitle(scope, groups),
        description: JSON.stringify({ scope, groupIds, postLimit }),
        totalItems,
        processedItems: 0,
        progress: 0,
        status: 'pending',
      } as Prisma.TaskUncheckedCreateInput,
    })) as PrismaTaskRecord;

    await this.parsingQueue.enqueue({
      taskId: task.id,
      scope,
      groupIds,
      postLimit,
    });

    return this.mapTaskToDetail(task);
  }

  async getTasks(): Promise<TaskSummary[]> {
    const tasks = await this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tasks.map((task) => this.mapTaskToSummary(task as PrismaTaskRecord));
  }

  async getTask(taskId: number): Promise<TaskDetail> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.mapTaskToDetail(task as PrismaTaskRecord);
  }

  async resumeTask(taskId: number): Promise<ParsingTaskResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const taskRecord = task as PrismaTaskRecord;
    const status = this.taskMapper.parseTaskStatus(taskRecord.status);
    if (status === 'done' || taskRecord.completed === true) {
      throw new BadRequestException('Задача уже завершена');
    }

    const context = await this.contextBuilder.buildResumeContext(taskRecord);

    const updatedTask = (await this.prisma.task.update({
      where: { id: taskId },
      data: {
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
      } as Prisma.TaskUncheckedUpdateInput,
    })) as PrismaTaskRecord;

    await this.parsingQueue.enqueue({
      taskId: task.id,
      scope: context.scope,
      groupIds: context.groupIds,
      postLimit: context.postLimit,
    });

    return this.mapTaskToDetail(updatedTask);
  }

  async refreshTask(taskId: number): Promise<ParsingTaskResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const taskRecord = task as PrismaTaskRecord;
    const context = await this.contextBuilder.buildResumeContext(taskRecord);
    const shouldComplete =
      context.totalItems > 0 &&
      context.processedItems >= context.totalItems;

    const updatedTask = (await this.prisma.task.update({
      where: { id: taskId },
      data: {
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
      } as Prisma.TaskUncheckedUpdateInput,
    })) as PrismaTaskRecord;

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
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
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

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    if (shouldClearCancellation) {
      this.cancellationService.clear(taskId);
    }
  }

  private mapTaskToDetail(task: PrismaTaskRecord): TaskDetail {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToDetail(task, parsed, status);
  }

  private mapTaskToSummary(task: PrismaTaskRecord): TaskSummary {
    const parsed = this.descriptionParser.parse(task);
    const status =
      this.taskMapper.parseTaskStatus(task.status) ??
      this.taskMapper.resolveTaskStatus(task, parsed);
    return this.taskMapper.mapToSummary(task, parsed, status);
  }
}
