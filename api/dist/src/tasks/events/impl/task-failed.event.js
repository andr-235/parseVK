export class TaskFailedEvent {
    taskId;
    failedAt;
    error;
    stats;
    constructor(taskId, failedAt, error, stats) {
        this.taskId = taskId;
        this.failedAt = failedAt;
        this.error = error;
        this.stats = stats;
    }
}
//# sourceMappingURL=task-failed.event.js.map