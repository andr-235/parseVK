var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskWebSocketNotificationHandler_1;
import { EventsHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { TasksGateway } from '../../../tasks/tasks.gateway.js';
import { TaskCreatedEvent, TaskStartedEvent, TaskProgressUpdatedEvent, TaskCompletedEvent, TaskFailedEvent, TaskDeletedEvent, } from '../index.js';
let TaskWebSocketNotificationHandler = TaskWebSocketNotificationHandler_1 = class TaskWebSocketNotificationHandler {
    tasksGateway;
    logger = new Logger(TaskWebSocketNotificationHandler_1.name);
    constructor(tasksGateway) {
        this.tasksGateway = tasksGateway;
    }
    handle(event) {
        try {
            if (event instanceof TaskCreatedEvent) {
                this.tasksGateway.broadcastStatus({
                    id: event.taskId,
                    status: 'pending',
                    createdAt: event.createdAt.toISOString(),
                });
            }
            else if (event instanceof TaskStartedEvent) {
                this.tasksGateway.broadcastStatus({
                    id: event.taskId,
                    status: 'running',
                });
            }
            else if (event instanceof TaskProgressUpdatedEvent) {
                this.tasksGateway.broadcastProgress({
                    id: event.taskId,
                    processedItems: event.processedItems,
                    progress: event.progress,
                    stats: event.stats ?? null,
                });
            }
            else if (event instanceof TaskCompletedEvent) {
                this.tasksGateway.broadcastStatus({
                    id: event.taskId,
                    status: 'done',
                    completed: true,
                    stats: event.stats,
                    completedAt: event.completedAt.toISOString(),
                });
            }
            else if (event instanceof TaskFailedEvent) {
                this.tasksGateway.broadcastStatus({
                    id: event.taskId,
                    status: 'failed',
                    error: event.error,
                    stats: event.stats ?? null,
                });
            }
            else if (event instanceof TaskDeletedEvent) {
                this.tasksGateway.broadcastStatus({
                    id: event.taskId,
                    status: 'done',
                    completed: true,
                });
            }
        }
        catch (error) {
            this.logger.error(`Failed to send WebSocket notification for taskId=${event.taskId}`, error instanceof Error ? error.stack : String(error));
        }
        return Promise.resolve();
    }
};
TaskWebSocketNotificationHandler = TaskWebSocketNotificationHandler_1 = __decorate([
    Injectable(),
    EventsHandler(TaskCreatedEvent, TaskStartedEvent, TaskProgressUpdatedEvent, TaskCompletedEvent, TaskFailedEvent, TaskDeletedEvent),
    __metadata("design:paramtypes", [TasksGateway])
], TaskWebSocketNotificationHandler);
export { TaskWebSocketNotificationHandler };
//# sourceMappingURL=task-websocket-notification.handler.js.map