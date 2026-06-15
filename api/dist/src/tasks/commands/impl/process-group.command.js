import { Command } from '@nestjs/cqrs';
export class ProcessGroupCommand extends Command {
    group;
    mode;
    postLimit;
    context;
    taskId;
    constructor(group, mode, postLimit, context, taskId) {
        super();
        this.group = group;
        this.mode = mode;
        this.postLimit = postLimit;
        this.context = context;
        this.taskId = taskId;
    }
}
//# sourceMappingURL=process-group.command.js.map