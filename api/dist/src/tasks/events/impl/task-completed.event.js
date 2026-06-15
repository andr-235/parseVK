export class TaskCompletedEvent {
    taskId;
    completedAt;
    stats;
    skippedGroupIds;
    constructor(taskId, completedAt, stats, skippedGroupIds) {
        this.taskId = taskId;
        this.completedAt = completedAt;
        this.stats = stats;
        this.skippedGroupIds = skippedGroupIds;
    }
}
//# sourceMappingURL=task-completed.event.js.map