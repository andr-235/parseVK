import { ICommandHandler, EventBus, CommandBus } from '@nestjs/cqrs';
import { ExecuteParsingTaskCommand } from '../impl/execute-parsing-task.command.js';
import type { IParsingTaskRepository } from '../../../tasks/interfaces/parsing-task-repository.interface.js';
import { TaskCancellationService } from '../../../tasks/task-cancellation.service.js';
import { TaskGroupResolverService } from '../../../tasks/services/task-group-resolver.service.js';
import { MetricsService } from '../../../metrics/metrics.service.js';
export declare class ExecuteParsingTaskHandler implements ICommandHandler<ExecuteParsingTaskCommand, void> {
    private readonly repository;
    private readonly commandBus;
    private readonly eventBus;
    private readonly cancellationService;
    private readonly groupResolver;
    private readonly metricsService?;
    private readonly logger;
    constructor(repository: IParsingTaskRepository, commandBus: CommandBus, eventBus: EventBus, cancellationService: TaskCancellationService, groupResolver: TaskGroupResolverService, metricsService?: MetricsService | undefined);
    execute(command: ExecuteParsingTaskCommand): Promise<void>;
    private processGroups;
    private completeTask;
    private failTask;
    private safeResolveGroups;
    private extractStoredMetadata;
    private normalizeParsingStats;
    private normalizeSkippedGroupIds;
    private extractGroupIdsFromMessage;
    private parseGroupId;
    private toFiniteNumber;
    private createProcessingContext;
    private buildSkippedGroupsMessage;
}
