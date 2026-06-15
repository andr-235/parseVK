import { ICommandHandler, EventBus } from '@nestjs/cqrs';
import { DeleteTaskCommand } from '../impl/delete-task.command.js';
import type { ITasksRepository } from '../../../tasks/interfaces/tasks-repository.interface.js';
import { ParsingQueueService } from '../../../tasks/parsing-queue.service.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
export declare class DeleteTaskHandler implements ICommandHandler<DeleteTaskCommand, void> {
    private readonly repository;
    private readonly parsingQueue;
    private readonly cancellationService;
    private readonly eventBus;
    private readonly logger;
    constructor(repository: ITasksRepository, parsingQueue: ParsingQueueService, cancellationService: TaskCancellationService, eventBus: EventBus);
    execute(command: DeleteTaskCommand): Promise<void>;
}
