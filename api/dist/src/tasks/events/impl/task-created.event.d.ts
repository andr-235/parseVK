export declare class TaskCreatedEvent {
    readonly taskId: number;
    readonly scope: string;
    readonly groupIds: number[];
    readonly postLimit: number | null;
    readonly mode: string;
    readonly createdAt: Date;
    constructor(taskId: number, scope: string, groupIds: number[], postLimit: number | null, mode: string, createdAt: Date);
}
