import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  CreateParsingTaskDto,
  ParsingScope,
} from './dto/create-parsing-task.dto';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface';
import type {
  TaskDetail,
  TaskSummary,
  TaskStatus,
} from './interfaces/task.interface';
import type { ParsingStats } from './interfaces/parsing-stats.interface';
import { ParsingTaskRunner } from './parsing-task.runner';
import { ParsingQueueService } from './parsing-queue.service';

type ParsedTaskDescription = {
  scope: ParsingScope | null;
  groupIds: number[];
  postLimit: number | null;
  stats: ParsingStats | null;
  error: string | null;
  skippedGroupsMessage: string | null;
  skippedGroupIds: number[];
};

type PrismaTaskRecord = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean | null;
  totalItems?: number | null;
  processedItems?: number | null;
  progress?: number | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: ParsingTaskRunner,
    private readonly parsingQueue: ParsingQueueService,
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
    return tasks.map((task) => this.mapTaskToSummary(task));
  }

  async getTask(taskId: number): Promise<TaskDetail> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.mapTaskToDetail(task);
  }

  async resumeTask(taskId: number): Promise<ParsingTaskResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const status = this.parseTaskStatus(task.status);
    if (status === 'done' || task.completed === true) {
      throw new BadRequestException('Задача уже завершена');
    }

    const context = await this.buildTaskResumeContext(task);

    const updatedTask = (await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'pending',
        completed: false,
        totalItems: context.totalItems,
        processedItems: context.processedItems,
        progress: context.progress,
        description: this.prepareResumeDescription(task.description, {
          scope: context.scope,
          groupIds: context.groupIds,
          postLimit: context.postLimit,
          stats: context.parsed.stats,
          skippedGroupsMessage: context.parsed.skippedGroupsMessage,
          skippedGroupIds: context.parsed.skippedGroupIds,
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

    const context = await this.buildTaskResumeContext(task);
    const shouldComplete =
      context.totalItems > 0 && context.processedItems >= context.totalItems;

    const updatedTask = (await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: shouldComplete ? 'done' : 'pending',
        completed: shouldComplete,
        totalItems: context.totalItems,
        processedItems: context.processedItems,
        progress: shouldComplete ? 1 : context.progress,
        description: this.prepareResumeDescription(task.description, {
          scope: context.scope,
          groupIds: context.groupIds,
          postLimit: context.postLimit,
          stats: context.parsed.stats,
          skippedGroupsMessage: context.parsed.skippedGroupsMessage,
          skippedGroupIds: context.parsed.skippedGroupIds,
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

    await this.parsingQueue.remove(taskId);

    await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  private mapTaskToDetail(task: PrismaTaskRecord): TaskDetail {
    return {
      ...this.mapTaskToSummary(task),
      description: task.description ?? null,
    };
  }

  private mapTaskToSummary(task: PrismaTaskRecord): TaskSummary {
    const parsed = this.parseTaskDescription(task);
    const totalItems = task.totalItems ?? 0;
    const processedItems = task.processedItems ?? 0;
    const completed = task.completed ?? false;
    const progress = task.progress ?? (completed ? 1 : 0);
    const status =
      this.parseTaskStatus(task.status) ?? this.resolveTaskStatus(task, parsed);
    return {
      id: task.id,
      title: task.title,
      status,
      completed,
      totalItems,
      processedItems,
      progress,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      scope: parsed.scope,
      groupIds: parsed.groupIds,
      postLimit: parsed.postLimit,
      stats: parsed.stats,
      error: parsed.error,
      skippedGroupsMessage: parsed.skippedGroupsMessage,
    };
  }

  private parseTaskStatus(value: unknown): TaskStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const allowed: TaskStatus[] = ['pending', 'running', 'done', 'failed'];
    return allowed.includes(value as TaskStatus) ? (value as TaskStatus) : null;
  }

  private resolveTaskStatus(
    task: PrismaTaskRecord,
    parsed: ParsedTaskDescription,
  ): TaskStatus {
    if (task.completed === true) {
      return 'done';
    }

    if (parsed.error) {
      return 'failed';
    }

    if ((task.processedItems ?? 0) > 0) {
      return 'running';
    }

    return 'pending';
  }

  private parseTaskDescription(task: PrismaTaskRecord): ParsedTaskDescription {
    const empty = this.createEmptyParsedDescription();

    if (!task.description) {
      return empty;
    }

    try {
      const data = JSON.parse(task.description) as Record<string, unknown>;

      return {
        ...empty,
        scope: this.parseScope(data.scope),
        groupIds: this.parseGroupIds(data.groupIds),
        postLimit: this.parsePostLimit(data.postLimit),
        stats: this.parseStats(data.stats),
        error: typeof data.error === 'string' ? data.error : null,
        skippedGroupsMessage:
          typeof data.skippedGroupsMessage === 'string'
            ? data.skippedGroupsMessage
            : null,
        skippedGroupIds: this.parseSkippedGroupIds(
          data.skippedGroupIds,
          typeof data.skippedGroupsMessage === 'string'
            ? data.skippedGroupsMessage
            : null,
        ),
      };
    } catch {
      return empty;
    }
  }

  private createEmptyParsedDescription(): ParsedTaskDescription {
    return {
      scope: null,
      groupIds: [],
      postLimit: null,
      stats: null,
      error: null,
      skippedGroupsMessage: null,
      skippedGroupIds: [],
    };
  }

  private parseScope(value: unknown): ParsingScope | null {
    if (typeof value !== 'string') {
      return null;
    }

    if (Object.values(ParsingScope).includes(value as ParsingScope)) {
      return value as ParsingScope;
    }

    return null;
  }

  private parseGroupIds(value: unknown): number[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) =>
        typeof item === 'number'
          ? item
          : Number.isFinite(Number(item))
            ? Number(item)
            : null,
      )
      .filter((item): item is number => item !== null && !Number.isNaN(item));
  }

  private parseSkippedGroupIds(
    value: unknown,
    message: string | null,
  ): number[] {
    const parsed = this.parseGroupIds(value);
    if (parsed.length > 0) {
      return parsed;
    }

    if (!message) {
      return [];
    }

    const matches = message.match(/\d+/g);
    if (!matches) {
      return [];
    }

    return matches
      .map((token) => Number.parseInt(token, 10))
      .filter((item) => Number.isFinite(item));
  }

  private parsePostLimit(value: unknown): number | null {
    const parsed = this.parseNumericField(value);
    return parsed ?? null;
  }

  private parseStats(value: unknown): ParsingStats | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const data = value as Record<string, unknown>;
    const groups = this.parseNumericField(data.groups);
    const posts = this.parseNumericField(data.posts);
    const comments = this.parseNumericField(data.comments);
    const authors = this.parseNumericField(data.authors);

    if ([groups, posts, comments, authors].some((item) => item === null)) {
      return null;
    }

    return {
      groups: groups as number,
      posts: posts as number,
      comments: comments as number,
      authors: authors as number,
    };
  }

  private parseNumericField(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizePostLimit(value: number | null): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 10;
    }

    const normalized = Math.trunc(value);
    return Math.max(1, Math.min(normalized, 100));
  }

  private prepareResumeDescription(
    current: string | null,
    update: {
      scope: ParsingScope;
      groupIds: number[];
      postLimit: number;
      stats: ParsingStats | null;
      skippedGroupsMessage: string | null;
      skippedGroupIds: number[];
    },
  ): string {
    let payload: Record<string, unknown> = {};

    if (current) {
      try {
        const parsed = JSON.parse(current) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          payload = { ...parsed };
        }
      } catch {
        payload = {};
      }
    }

    payload.scope = update.scope;
    payload.groupIds = update.groupIds;
    payload.postLimit = update.postLimit;

    if (update.stats) {
      payload.stats = update.stats;
    } else {
      delete payload.stats;
    }

    if (update.skippedGroupsMessage) {
      payload.skippedGroupsMessage = update.skippedGroupsMessage;
    } else {
      delete payload.skippedGroupsMessage;
    }

    const uniqueSkippedIds = Array.from(new Set(update.skippedGroupIds));
    if (uniqueSkippedIds.length) {
      payload.skippedGroupIds = uniqueSkippedIds;
    } else {
      delete payload.skippedGroupIds;
    }

    if ('error' in payload) {
      delete payload.error;
    }

    return JSON.stringify(payload);
  }

  private async buildTaskResumeContext(task: PrismaTaskRecord): Promise<{
    scope: ParsingScope;
    groupIds: number[];
    postLimit: number;
    parsed: ParsedTaskDescription;
    totalItems: number;
    processedItems: number;
    progress: number;
  }> {
    const parsed = this.parseTaskDescription(task);
    const scope =
      parsed.scope ??
      (parsed.groupIds.length ? ParsingScope.SELECTED : ParsingScope.ALL);

    const groupIds =
      scope === ParsingScope.ALL ? [] : Array.from(new Set(parsed.groupIds));
    if (scope === ParsingScope.SELECTED && groupIds.length === 0) {
      throw new BadRequestException(
        'Не удалось определить группы для продолжения задачи',
      );
    }

    const postLimit = this.normalizePostLimit(parsed.postLimit);
    const groups = await this.runner.resolveGroups(scope, groupIds);

    if (!groups.length) {
      throw new NotFoundException('Нет доступных групп для парсинга');
    }

    const totalItems = groups.length;
    const processedItems = Math.min(task.processedItems ?? 0, totalItems);
    const progress =
      totalItems > 0 ? Math.min(1, processedItems / totalItems) : 0;

    return {
      scope,
      groupIds,
      postLimit,
      parsed,
      totalItems,
      processedItems,
      progress,
    };
  }
}
