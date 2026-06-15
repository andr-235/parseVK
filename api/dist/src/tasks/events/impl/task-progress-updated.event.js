export class TaskProgressUpdatedEvent {
    taskId;
    processedItems;
    progress;
    stats;
    constructor(taskId, processedItems, progress, stats) {
        this.taskId = taskId;
        this.processedItems = processedItems;
        this.progress = progress;
        this.stats = stats;
    }
}
//# sourceMappingURL=task-progress-updated.event.js.map