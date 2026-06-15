import { IQueryHandler } from '@nestjs/cqrs';
import { GetTasksQuery } from '../impl/get-tasks.query.js';
import type { ITasksRepository } from '../../../tasks/interfaces/tasks-repository.interface.js';
import type { TaskSummary } from '../../../tasks/interfaces/task.interface.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
export interface GetTasksResult {
    tasks: TaskSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}
export declare class GetTasksHandler implements IQueryHandler<GetTasksQuery, GetTasksResult> {
    private readonly repository;
    private readonly taskMapper;
    private readonly descriptionParser;
    constructor(repository: ITasksRepository, taskMapper: TaskMapper, descriptionParser: TaskDescriptionParser);
    execute(query: GetTasksQuery): Promise<GetTasksResult>;
    private mapTaskToSummary;
}
