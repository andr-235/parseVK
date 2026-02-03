import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { TasksGateway } from '@/tasks/tasks.gateway.js';
import {
  TaskCreatedEvent,
  TaskStartedEvent,
  TaskProgressUpdatedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskDeletedEvent,
} from '../index.js';

@Injectable()
@EventsHandler(
  TaskCreatedEvent,
  TaskStartedEvent,
  TaskProgressUpdatedEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskDeletedEvent,
)
export class TaskWebSocketNotificationHandler implements IEventHandler<
  | TaskCreatedEvent
  | TaskStartedEvent
  | TaskProgressUpdatedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskDeletedEvent
> {
  private readonly logger = new Logger(TaskWebSocketNotificationHandler.name);

  constructor(private readonly tasksGateway: TasksGateway) {}

  handle(
    event:
      | TaskCreatedEvent
      | TaskStartedEvent
      | TaskProgressUpdatedEvent
      | TaskCompletedEvent
      | TaskFailedEvent
      | TaskDeletedEvent,
  ): Promise<void> {
    try {
      if (event instanceof TaskCreatedEvent) {
        this.tasksGateway.broadcastStatus({
          id: event.taskId,
          status: 'pending',
          createdAt: event.createdAt.toISOString(),
        });
      } else if (event instanceof TaskStartedEvent) {
        this.tasksGateway.broadcastStatus({
          id: event.taskId,
          status: 'running',
        });
      } else if (event instanceof TaskProgressUpdatedEvent) {
        this.tasksGateway.broadcastProgress({
          id: event.taskId,
          processedItems: event.processedItems,
          progress: event.progress,
          stats: event.stats ?? null,
        });
      } else if (event instanceof TaskCompletedEvent) {
        this.tasksGateway.broadcastStatus({
          id: event.taskId,
          status: 'done',
          completed: true,
          stats: event.stats,
          completedAt: event.completedAt.toISOString(),
        });
      } else if (event instanceof TaskFailedEvent) {
        this.tasksGateway.broadcastStatus({
          id: event.taskId,
          status: 'failed',
          error: event.error,
          stats: event.stats ?? null,
        });
      } else if (event instanceof TaskDeletedEvent) {
        this.tasksGateway.broadcastStatus({
          id: event.taskId,
          status: 'done',
          completed: true,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send WebSocket notification for taskId=${event.taskId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return Promise.resolve();
  }
}
