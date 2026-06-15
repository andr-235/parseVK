import type { ParsingScope, ParsingTaskMode } from '../../../tasks/dto/create-parsing-task.dto.js';
export declare class CreateParsingTaskCommand {
    readonly scope?: ParsingScope | undefined;
    readonly groupIds?: number[] | undefined;
    readonly postLimit?: number | undefined;
    readonly mode?: ParsingTaskMode | undefined;
    constructor(scope?: ParsingScope | undefined, groupIds?: number[] | undefined, postLimit?: number | undefined, mode?: ParsingTaskMode | undefined);
}
