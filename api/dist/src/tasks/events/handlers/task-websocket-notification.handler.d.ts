import { IEventHandler } from '@nestjs/cqrs';
import { TasksGateway } from '../../../tasks/tasks.gateway.js';
import { TaskCreatedEvent, TaskStartedEvent, TaskProgressUpdatedEvent, TaskCompletedEvent, TaskFailedEvent, TaskDeletedEvent } from '../index.js';
export declare class TaskWebSocketNotificationHandler implements IEventHandler<TaskCreatedEvent | TaskStartedEvent | TaskProgressUpdatedEvent | TaskCompletedEvent | TaskFailedEvent | TaskDeletedEvent> {
    private readonly tasksGateway;
    private readonly logger;
    constructor(tasksGateway: TasksGateway);
    handle(event: TaskCreatedEvent | TaskStartedEvent | TaskProgressUpdatedEvent | TaskCompletedEvent | TaskFailedEvent | TaskDeletedEvent): Promise<void>;
}
