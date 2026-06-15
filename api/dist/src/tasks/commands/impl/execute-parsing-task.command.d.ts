import type { ParsingScope, ParsingTaskMode } from '../../../tasks/dto/create-parsing-task.dto.js';
export declare class ExecuteParsingTaskCommand {
    readonly taskId: number;
    readonly scope: ParsingScope;
    readonly groupIds: number[];
    readonly postLimit: number | null;
    readonly mode: ParsingTaskMode;
    constructor(taskId: number, scope: ParsingScope, groupIds: number[], postLimit: number | null, mode: ParsingTaskMode);
}
