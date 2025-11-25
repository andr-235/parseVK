import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ParsingScope } from '../dto/create-parsing-task.dto';
import type { ParsingStats } from '../interfaces/parsing-stats.interface';
import type { ParsedTaskDescription } from '../parsers/task-description.parser';
import { ParsingTaskRunner } from '../parsing-task.runner';
import { TaskDescriptionParser } from '../parsers/task-description.parser';

export interface PrismaTaskRecord {
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
}

export interface TaskResumeContext {
  scope: ParsingScope;
  groupIds: number[];
  postLimit: number;
  parsed: ParsedTaskDescription;
  totalItems: number;
  processedItems: number;
  progress: number;
}

@Injectable()
export class TaskContextBuilder {
  constructor(
    private readonly runner: ParsingTaskRunner,
    private readonly parser: TaskDescriptionParser,
  ) {}

  async buildResumeContext(task: PrismaTaskRecord): Promise<TaskResumeContext> {
    const parsed = this.parser.parse(task);
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

  private normalizePostLimit(value: number | null): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 10;
    }

    const normalized = Math.trunc(value);
    return Math.max(1, Math.min(normalized, 100));
  }
}

