import { ParsingScope, ParsingTaskMode } from '../dto/create-parsing-task.dto.js';
import type { ParsedTaskDescription } from '../parsers/task-description.parser.js';
import { TaskGroupResolverService } from '../services/task-group-resolver.service.js';
import { TaskDescriptionParser } from '../parsers/task-description.parser.js';
import type { TaskRecord } from '../types/task-record.type.js';
export interface TaskResumeContext {
    scope: ParsingScope;
    groupIds: number[];
    mode: ParsingTaskMode;
    postLimit: number | null;
    parsed: ParsedTaskDescription;
    totalItems: number;
    processedItems: number;
    progress: number;
}
export declare class TaskContextBuilder {
    private readonly groupResolver;
    private readonly parser;
    constructor(groupResolver: TaskGroupResolverService, parser: TaskDescriptionParser);
    buildResumeContext(task: TaskRecord): Promise<TaskResumeContext>;
    private normalizePostLimit;
}
