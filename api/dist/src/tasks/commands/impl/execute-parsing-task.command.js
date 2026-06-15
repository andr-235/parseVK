export class ExecuteParsingTaskCommand {
    taskId;
    scope;
    groupIds;
    postLimit;
    mode;
    constructor(taskId, scope, groupIds, postLimit, mode) {
        this.taskId = taskId;
        this.scope = scope;
        this.groupIds = groupIds;
        this.postLimit = postLimit;
        this.mode = mode;
    }
}
//# sourceMappingURL=execute-parsing-task.command.js.map