export class TaskCreatedEvent {
    taskId;
    scope;
    groupIds;
    postLimit;
    mode;
    createdAt;
    constructor(taskId, scope, groupIds, postLimit, mode, createdAt) {
        this.taskId = taskId;
        this.scope = scope;
        this.groupIds = groupIds;
        this.postLimit = postLimit;
        this.mode = mode;
        this.createdAt = createdAt;
    }
}
//# sourceMappingURL=task-created.event.js.map