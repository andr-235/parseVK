import { IEventHandler } from '@nestjs/cqrs';
import { TaskAuditLogRepository } from '../../../tasks/repositories/task-audit-log.repository.js';
import { TaskCreatedEvent, TaskStartedEvent, TaskProgressUpdatedEvent, TaskCompletedEvent, TaskFailedEvent, TaskResumedEvent, TaskDeletedEvent } from '../index.js';
type TaskEvent = TaskCreatedEvent | TaskStartedEvent | TaskProgressUpdatedEvent | TaskCompletedEvent | TaskFailedEvent | TaskResumedEvent | TaskDeletedEvent;
export declare class TaskAuditLogHandler implements IEventHandler<TaskEvent> {
    private readonly auditLogRepository;
    private readonly logger;
    constructor(auditLogRepository: TaskAuditLogRepository);
    handle(event: TaskEvent): Promise<void>;
    private getEventType;
    private extractEventData;
}
export {};
