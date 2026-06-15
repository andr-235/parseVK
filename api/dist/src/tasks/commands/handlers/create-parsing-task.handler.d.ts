import { ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateParsingTaskCommand } from '../impl/create-parsing-task.command.js';
import type { ITasksRepository } from '../../../tasks/interfaces/tasks-repository.interface.js';
import type { TaskDetail } from '../../../tasks/interfaces/task.interface.js';
import { TaskGroupResolverService } from '../../../tasks/services/task-group-resolver.service.js';
import { ParsingQueueService } from '../../../tasks/parsing-queue.service.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
import { MetricsService } from '../../../metrics/metrics.service.js';
export declare class CreateParsingTaskHandler implements ICommandHandler<CreateParsingTaskCommand, TaskDetail> {
    private readonly repository;
    private readonly groupResolver;
    private readonly parsingQueue;
    private readonly eventBus;
    private readonly taskMapper;
    private readonly descriptionParser;
    private readonly metricsService?;
    constructor(repository: ITasksRepository, groupResolver: TaskGroupResolverService, parsingQueue: ParsingQueueService, eventBus: EventBus, taskMapper: TaskMapper, descriptionParser: TaskDescriptionParser, metricsService?: MetricsService | undefined);
    execute(command: CreateParsingTaskCommand): Promise<TaskDetail>;
    private mapTaskToDetail;
}
