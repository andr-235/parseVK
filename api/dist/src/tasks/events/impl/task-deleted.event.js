export class TaskDeletedEvent {
    taskId;
    deletedAt;
    constructor(taskId, deletedAt) {
        this.taskId = taskId;
        this.deletedAt = deletedAt;
    }
}
//# sourceMappingURL=task-deleted.event.js.map