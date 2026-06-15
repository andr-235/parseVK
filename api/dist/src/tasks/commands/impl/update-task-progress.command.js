export class UpdateTaskProgressCommand {
    taskId;
    processedItems;
    progress;
    status;
    stats;
    constructor(taskId, processedItems, progress, status, stats) {
        this.taskId = taskId;
        this.processedItems = processedItems;
        this.progress = progress;
        this.status = status;
        this.stats = stats;
    }
}
//# sourceMappingURL=update-task-progress.command.js.map