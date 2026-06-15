import { ParsingScope, ParsingTaskMode } from '../dto/create-parsing-task.dto.js';
import type { IParsingTaskRepository, ParsingGroupRecord } from '../interfaces/parsing-task-repository.interface.js';
export declare class TaskGroupResolverService {
    private readonly repository;
    constructor(repository: IParsingTaskRepository);
    resolveGroups(scope: ParsingScope, groupIds: number[]): Promise<ParsingGroupRecord[]>;
    buildTaskTitle(scope: ParsingScope, groups: ParsingGroupRecord[], mode?: ParsingTaskMode): string;
}
