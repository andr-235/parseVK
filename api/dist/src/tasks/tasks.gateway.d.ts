import type { ParsingScope } from './dto/create-parsing-task.dto.js';
import type { ParsingStats } from './interfaces/parsing-stats.interface.js';
export type GatewayTaskStatus = 'pending' | 'running' | 'done' | 'failed';
export interface TaskGatewayPayload {
    id: number;
    status?: GatewayTaskStatus;
    completed?: boolean;
    totalItems?: number | null;
    processedItems?: number | null;
    progress?: number | null;
    stats?: ParsingStats | null;
    scope?: ParsingScope | null;
    groupIds?: number[] | null;
    postLimit?: number | null;
    skippedGroupsMessage?: string | null;
    description?: string | null;
    error?: string | null;
    title?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    completedAt?: string | null;
}
export declare class TasksGateway {
    private readonly server;
    broadcastProgress(payload: TaskGatewayPayload): void;
    broadcastStatus(payload: TaskGatewayPayload): void;
    private emit;
}
