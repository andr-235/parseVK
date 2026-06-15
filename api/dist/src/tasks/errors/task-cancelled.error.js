export class TaskCancelledError extends Error {
    taskId;
    constructor(taskId) {
        super(`Task ${taskId} was cancelled`);
        this.taskId = taskId;
        this.name = 'TaskCancelledError';
    }
}
//# sourceMappingURL=task-cancelled.error.js.map