import type { ParsingGroupRecord } from '../../../tasks/interfaces/parsing-task-repository.interface.js';
import type { TaskProcessingContext } from '../../../tasks/interfaces/parsing-task-runner.types.js';
import { Command } from '@nestjs/cqrs';
import type { ParsingTaskMode } from '../../../tasks/dto/create-parsing-task.dto.js';
export declare class ProcessGroupCommand extends Command<boolean> {
    readonly group: ParsingGroupRecord;
    readonly mode: ParsingTaskMode;
    readonly postLimit: number | null;
    readonly context: TaskProcessingContext;
    readonly taskId: number;
    constructor(group: ParsingGroupRecord, mode: ParsingTaskMode, postLimit: number | null, context: TaskProcessingContext, taskId: number);
}
