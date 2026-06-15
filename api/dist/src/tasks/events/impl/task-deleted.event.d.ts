export declare class TaskDeletedEvent {
    readonly taskId: number;
    readonly deletedAt: Date;
    constructor(taskId: number, deletedAt: Date);
}
