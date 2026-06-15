import { ICommandHandler, EventBus } from '@nestjs/cqrs';
import { UpdateTaskProgressCommand } from '../impl/update-task-progress.command.js';
import type { IParsingTaskRepository } from '../../../tasks/interfaces/parsing-task-repository.interface.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
export declare class UpdateTaskProgressHandler implements ICommandHandler<UpdateTaskProgressCommand, void> {
    private readonly repository;
    private readonly eventBus;
    private readonly cancellationService;
    constructor(repository: IParsingTaskRepository, eventBus: EventBus, cancellationService: TaskCancellationService);
    execute(command: UpdateTaskProgressCommand): Promise<void>;
}
