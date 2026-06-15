import { ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { ProcessGroupCommand } from '../impl/process-group.command.js';
import { VkService } from '../../../vk/vk.service.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
import type { IParsingTaskRepository } from '../../../tasks/interfaces/parsing-task-repository.interface.js';
export declare class ProcessGroupHandler implements ICommandHandler<ProcessGroupCommand, boolean> {
    private readonly vkService;
    private readonly commandBus;
    private readonly repository;
    private readonly cancellationService;
    private readonly logger;
    constructor(vkService: VkService, commandBus: CommandBus, repository: IParsingTaskRepository, cancellationService: TaskCancellationService);
    execute(command: ProcessGroupCommand): Promise<boolean>;
    private processPostsBatch;
    private fetchAllComments;
    private collectAuthorIds;
    private extractNewAuthorIds;
    private handleSkippedGroup;
    private toGroupOwnerId;
    private isGroupWallDisabled;
    private isWallDisabledApiError;
    private isTemporaryVkApiError;
    private isTimeoutError;
    private markGroupWallDisabled;
}
