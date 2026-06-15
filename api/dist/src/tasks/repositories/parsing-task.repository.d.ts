import { PrismaService } from '../../prisma.service.js';
import type { IParsingTaskRepository, ParsingGroupRecord, ParsingTaskRecord, PostUpsertData, TaskUpdateData } from '../interfaces/parsing-task-repository.interface.js';
import { ParsingScope } from '../dto/create-parsing-task.dto.js';
export declare class ParsingTaskRepository implements IParsingTaskRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findTaskById(taskId: number): Promise<ParsingTaskRecord | null>;
    updateTask(taskId: number, data: TaskUpdateData): Promise<ParsingTaskRecord | null>;
    updateTaskStatus(taskId: number, status: 'running' | 'failed'): Promise<ParsingTaskRecord | null>;
    findGroups(scope: ParsingScope, groupIds: number[]): Promise<ParsingGroupRecord[]>;
    updateGroupWall(groupId: number, wall: number): Promise<void>;
    upsertPost(data: PostUpsertData): Promise<void>;
}
