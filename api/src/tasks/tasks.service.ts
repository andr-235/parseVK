import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateParsingTaskDto, ParsingScope } from './dto/create-parsing-task.dto';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface';
import type { TaskDetail, TaskSummary, TaskStatus } from './interfaces/task.interface';
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

  async createParsingTask(dto: CreateParsingTaskDto): Promise<ParsingTaskResult> {
    const scope = dto.scope ?? (dto.groupIds?.length ? ParsingScope.SELECTED : ParsingScope.ALL);
    const postLimit = dto.postLimit ?? 10;
    const groupIds = dto.groupIds ?? [];

    const groups = await this.runner.resolveGroups(scope, groupIds);
    if (!groups.length) {
      throw new NotFoundException('Нет доступных групп для парсинга');
    }

    const totalItems = groups.length;

    const task = await this.prisma.task.create({
      data: {
        title: this.runner.buildTaskTitle(scope, groups),
        description: JSON.stringify({ scope, groupIds, postLimit }),
        totalItems,
        processedItems: 0,
        progress: 0,
        status: 'pending',
      } as Prisma.TaskUncheckedCreateInput,
    }) as PrismaTaskRecord;

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
    const status = this.parseTaskStatus(task.status) ?? this.resolveTaskStatus(task, parsed);
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

  private resolveTaskStatus(task: PrismaTaskRecord, parsed: ParsedTaskDescription): TaskStatus {
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
        skippedGroupsMessage: typeof data.skippedGroupsMessage === 'string'
          ? data.skippedGroupsMessage
          : null,
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
      .map((item) => (typeof item === 'number' ? item : Number.isFinite(Number(item)) ? Number(item) : null))
      .filter((item): item is number => item !== null && !Number.isNaN(item));
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
}
