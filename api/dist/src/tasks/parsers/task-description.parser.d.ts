import { ParsingScope, ParsingTaskMode } from '../dto/create-parsing-task.dto.js';
import type { ParsingStats } from '../interfaces/parsing-stats.interface.js';
import type { TaskRecord } from '../types/task-record.type.js';
export interface ParsedTaskDescription {
    scope: ParsingScope | null;
    mode: ParsingTaskMode | null;
    groupIds: number[];
    postLimit: number | null;
    stats: ParsingStats | null;
    error: string | null;
    skippedGroupsMessage: string | null;
    skippedGroupIds: number[];
}
export declare class TaskDescriptionParser {
    parse(task: TaskRecord): ParsedTaskDescription;
    stringify(data: {
        scope: ParsingScope;
        mode?: ParsingTaskMode | null;
        groupIds: number[];
        postLimit: number | null;
        stats: ParsingStats | null;
        skippedGroupsMessage: string | null;
        skippedGroupIds: number[];
        current?: string | null;
    }): string;
    private createEmpty;
    private parseScope;
    private parseMode;
    private parseGroupIds;
    private parseSkippedGroupIds;
    private parsePostLimit;
    private parseStats;
    private parseNumericField;
}
