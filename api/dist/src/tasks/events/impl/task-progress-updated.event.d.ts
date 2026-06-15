import type { ParsingStats } from '../../../tasks/interfaces/parsing-stats.interface.js';
export declare class TaskProgressUpdatedEvent {
    readonly taskId: number;
    readonly processedItems: number;
    readonly progress: number;
    readonly stats?: ParsingStats | undefined;
    constructor(taskId: number, processedItems: number, progress: number, stats?: ParsingStats | undefined);
}
