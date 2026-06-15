var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskAuditLogHandler_1;
import { EventsHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { TaskAuditLogRepository } from '../../../tasks/repositories/task-audit-log.repository.js';
import { TaskCreatedEvent, TaskStartedEvent, TaskProgressUpdatedEvent, TaskCompletedEvent, TaskFailedEvent, TaskResumedEvent, TaskDeletedEvent, } from '../index.js';
let TaskAuditLogHandler = TaskAuditLogHandler_1 = class TaskAuditLogHandler {
    auditLogRepository;
    logger = new Logger(TaskAuditLogHandler_1.name);
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async handle(event) {
        try {
            const eventType = this.getEventType(event);
            const eventData = this.extractEventData(event);
            await this.auditLogRepository.create({
                taskId: event.taskId,
                eventType,
                eventData,
            });
            this.logger.debug(`Audit log created: taskId=${event.taskId}, eventType=${eventType}`);
        }
        catch (error) {
            this.logger.error(`Failed to create audit log for taskId=${event.taskId}`, error instanceof Error ? error.stack : String(error));
        }
    }
    getEventType(event) {
        if (event instanceof TaskCreatedEvent)
            return 'created';
        if (event instanceof TaskStartedEvent)
            return 'started';
        if (event instanceof TaskProgressUpdatedEvent)
            return 'progress_updated';
        if (event instanceof TaskCompletedEvent)
            return 'completed';
        if (event instanceof TaskFailedEvent)
            return 'failed';
        if (event instanceof TaskResumedEvent)
            return 'resumed';
        if (event instanceof TaskDeletedEvent)
            return 'deleted';
        return 'unknown';
    }
    extractEventData(event) {
        if (event instanceof TaskCreatedEvent) {
            return {
                scope: event.scope,
                groupIds: event.groupIds,
                mode: event.mode,
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
};
TaskAuditLogHandler = TaskAuditLogHandler_1 = __decorate([
    Injectable(),
    EventsHandler(TaskCreatedEvent, TaskStartedEvent, TaskProgressUpdatedEvent, TaskCompletedEvent, TaskFailedEvent, TaskResumedEvent, TaskDeletedEvent),
    __metadata("design:paramtypes", [TaskAuditLogRepository])
], TaskAuditLogHandler);
export { TaskAuditLogHandler };
//# sourceMappingURL=task-audit-log.handler.js.map