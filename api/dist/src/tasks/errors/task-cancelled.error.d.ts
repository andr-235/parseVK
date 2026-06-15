export declare class TaskCancelledError extends Error {
    readonly taskId: number;
    constructor(taskId: number);
}
