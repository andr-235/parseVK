import { IQueryHandler } from '@nestjs/cqrs';
import { GetTaskByIdQuery } from '../impl/get-task-by-id.query.js';
import type { ITasksRepository } from '../../../tasks/interfaces/tasks-repository.interface.js';
import type { TaskDetail } from '../../../tasks/interfaces/task.interface.js';
import { TaskMapper } from '../../../tasks/mappers/task.mapper.js';
import { TaskDescriptionParser } from '../../../tasks/parsers/task-description.parser.js';
export declare class GetTaskByIdHandler implements IQueryHandler<GetTaskByIdQuery, TaskDetail> {
    private readonly repository;
    private readonly taskMapper;
    private readonly descriptionParser;
    constructor(repository: ITasksRepository, taskMapper: TaskMapper, descriptionParser: TaskDescriptionParser);
    execute(query: GetTaskByIdQuery): Promise<TaskDetail>;
    private mapTaskToDetail;
}
