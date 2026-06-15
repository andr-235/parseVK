import { IQueryHandler } from '@nestjs/cqrs';
import { GetTaskStatisticsQuery } from '../impl/get-task-statistics.query.js';
import type { ITasksRepository } from '../../../tasks/interfaces/tasks-repository.interface.js';
export interface TaskStatistics {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
}
export declare class GetTaskStatisticsHandler implements IQueryHandler<GetTaskStatisticsQuery, TaskStatistics> {
    private readonly repository;
    constructor(repository: ITasksRepository);
    execute(query: GetTaskStatisticsQuery): Promise<TaskStatistics>;
}
