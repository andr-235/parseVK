import { Injectable } from '@nestjs/common';
import type {
  TaskDetail,
  TaskSummary,
  TaskStatus,
} from '../interfaces/task.interface';
import type { ParsedTaskDescription } from '../parsers/task-description.parser';
import type { TaskRecord } from '../types/task-record.type';

@Injectable()
export class TaskMapper {
  mapToDetail(
    task: TaskRecord,
    parsed: ParsedTaskDescription,
    status: TaskStatus,
  ): TaskDetail {
    return {
      ...this.mapToSummary(task, parsed, status),
      description: task.description ?? null,
    };
  }

  mapToSummary(
    task: TaskRecord,
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
    task: TaskRecord,
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
