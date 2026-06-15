import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateParsingTaskDto } from './dto/create-parsing-task.dto.js';
import { GetTasksQueryDto } from './dto/get-tasks-query.dto.js';
import type { ParsingTaskResult } from './interfaces/parsing-task-result.interface.js';
import type { TaskDetail, TaskSummary } from './interfaces/task.interface.js';
import type { TaskAuditLog } from './interfaces/task-audit-log.interface.js';
export declare class TasksController {
    private readonly commandBus;
    private readonly queryBus;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    createParsingTask(dto: CreateParsingTaskDto): Promise<ParsingTaskResult>;
    getTasks(query: GetTasksQueryDto): Promise<{
        tasks: TaskSummary[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    getTask(taskId: number): Promise<TaskDetail>;
    getTaskAuditLog(taskId: number): Promise<TaskAuditLog[]>;
    resumeTask(taskId: number): Promise<ParsingTaskResult>;
    refreshTask(taskId: number): Promise<ParsingTaskResult>;
    deleteTask(taskId: number): Promise<void>;
}
