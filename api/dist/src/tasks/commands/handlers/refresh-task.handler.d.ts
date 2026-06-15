import { ICommandHandler } from '@nestjs/cqrs';
import { RefreshTaskCommand } from '../impl/refresh-task.command.js';
import type { ITasksRepository } from '../../../tasks/interfaces/tasks-repository.interface.js';
import type { TaskDetail } from '../../../tasks/interfaces/task.interface.js';
import { ParsingQueueService } from '../../../tasks/parsing-queue.service.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
import { TaskContextBuilder } from '../../../tasks/builders/task-context.builder.js';
export declare class RefreshTaskHandler implements ICommandHandler<RefreshTaskCommand, TaskDetail> {
    private readonly repository;
    private readonly parsingQueue;
    private readonly taskMapper;
    private readonly descriptionParser;
    private readonly contextBuilder;
    constructor(repository: ITasksRepository, parsingQueue: ParsingQueueService, taskMapper: TaskMapper, descriptionParser: TaskDescriptionParser, contextBuilder: TaskContextBuilder);
    execute(command: RefreshTaskCommand): Promise<TaskDetail>;
    private mapTaskToDetail;
}
