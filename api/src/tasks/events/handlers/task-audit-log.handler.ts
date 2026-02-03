import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { TaskAuditLogRepository } from '@/tasks/repositories/task-audit-log.repository.js';
import {
  TaskCreatedEvent,
  TaskStartedEvent,
  TaskProgressUpdatedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskResumedEvent,
  TaskDeletedEvent,
} from '../index.js';

// Определите union type для всех событий
type TaskEvent =
  | TaskCreatedEvent
  | TaskStartedEvent
  | TaskProgressUpdatedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskResumedEvent
  | TaskDeletedEvent;

// Определите тип для данных события
type EventData = {
  scope?: string;
  groupIds?: unknown[];
  postLimit?: number;
  processedItems?: number;
  progress?: number;
  stats?: unknown;
  skippedGroupIds?: unknown[];
  error?: string;
} | null;

@Injectable()
@EventsHandler(
  TaskCreatedEvent,
  TaskStartedEvent,
  TaskProgressUpdatedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskResumedEvent,
  TaskDeletedEvent,
)
export class TaskAuditLogHandler implements IEventHandler<TaskEvent> {
  private readonly logger = new Logger(TaskAuditLogHandler.name);

  constructor(private readonly auditLogRepository: TaskAuditLogRepository) {}

  async handle(event: TaskEvent): Promise<void> {
    try {
      const eventType = this.getEventType(event);
      const eventData = this.extractEventData(event);

      await this.auditLogRepository.create({
        taskId: event.taskId,
        eventType,
        eventData,
      });

      this.logger.debug(
        `Audit log created: taskId=${event.taskId}, eventType=${eventType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for taskId=${event.taskId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private getEventType(event: TaskEvent): string {
    if (event instanceof TaskCreatedEvent) return 'created';
    if (event instanceof TaskStartedEvent) return 'started';
    if (event instanceof TaskProgressUpdatedEvent) return 'progress_updated';
    if (event instanceof TaskCompletedEvent) return 'completed';
    if (event instanceof TaskFailedEvent) return 'failed';
    if (event instanceof TaskResumedEvent) return 'resumed';
    if (event instanceof TaskDeletedEvent) return 'deleted';
    return 'unknown';
  }

  private extractEventData(event: TaskEvent): EventData {
    if (event instanceof TaskCreatedEvent) {
      return {
        scope: event.scope,
        groupIds: event.groupIds,
        postLimit: event.postLimit,
      };
    }

    if (event instanceof TaskProgressUpdatedEvent) {
      return {
        processedItems: event.processedItems,
        progress: event.progress,
        stats: event.stats,
      };
    }

    if (event instanceof TaskCompletedEvent) {
      return {
        stats: event.stats,
        skippedGroupIds: event.skippedGroupIds,
      };
    }

    if (event instanceof TaskFailedEvent) {
      return {
        error: event.error,
        stats: event.stats,
      };
    }

    return null;
  }
}
