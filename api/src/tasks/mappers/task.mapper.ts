import { Injectable } from '@nestjs/common';
import type {
  TaskDetail,
  TaskSummary,
  TaskStatus,
} from '../interfaces/task.interface';
import type { ParsingScope } from '../dto/create-parsing-task.dto';
import type { ParsingStats } from '../interfaces/parsing-stats.interface';
import type { ParsedTaskDescription } from '../parsers/task-description.parser';

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

@Injectable()
export class TaskMapper {
  mapToDetail(
    task: PrismaTaskRecord,
    parsed: ParsedTaskDescription,
    status: TaskStatus,
  ): TaskDetail {
    return {
      ...this.mapToSummary(task, parsed, status),
      description: task.description ?? null,
    };
  }

  mapToSummary(
    task: PrismaTaskRecord,
    parsed: ParsedTaskDescription,
    status: TaskStatus,
  ): TaskSummary {
    const totalItems = task.totalItems ?? 0;
    const processedItems = task.processedItems ?? 0;
    const completed = task.completed ?? false;
    const progress = task.progress ?? (completed ? 1 : 0);

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

  parseTaskStatus(value: unknown): TaskStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const allowed: TaskStatus[] = ['pending', 'running', 'done', 'failed'];
    return allowed.includes(value as TaskStatus) ? (value as TaskStatus) : null;
  }

  resolveTaskStatus(
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
}
