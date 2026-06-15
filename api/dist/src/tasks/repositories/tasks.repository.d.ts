import { PrismaService } from '../../prisma.service.js';
import type { ITasksRepository, TaskCreateData, TaskOrderByInput, TaskUpdateData, TaskWhereInput } from '../interfaces/tasks-repository.interface.js';
import type { TaskRecord } from '../types/task-record.type.js';
export declare class TasksRepository implements ITasksRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: TaskCreateData): Promise<TaskRecord>;
    findMany(params?: {
        skip?: number;
        take?: number;
        where?: TaskWhereInput;
        orderBy?: TaskOrderByInput;
    }): Promise<TaskRecord[]>;
    count(): Promise<number>;
    findUnique(where: {
        id: number;
    }): Promise<TaskRecord | null>;
    update(where: {
        id: number;
    }, data: TaskUpdateData): Promise<TaskRecord | null>;
    delete(where: {
        id: number;
    }): Promise<void>;
}
