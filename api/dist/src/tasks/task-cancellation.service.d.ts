export declare class TaskCancellationService {
    private readonly cancelledTasks;
    requestCancel(taskId: number): void;
    clear(taskId: number): void;
    isCancelled(taskId: number): boolean;
    throwIfCancelled(taskId: number): void;
}
