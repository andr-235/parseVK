import type { ParsingStats } from '../../../tasks/interfaces/parsing-stats.interface.js';
export declare class UpdateTaskProgressCommand {
    readonly taskId: number;
    readonly processedItems: number;
    readonly progress: number;
    readonly status: string;
    readonly stats?: ParsingStats | undefined;
    constructor(taskId: number, processedItems: number, progress: number, status: string, stats?: ParsingStats | undefined);
}
