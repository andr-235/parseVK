import type { ParsingStats } from '../../../tasks/interfaces/parsing-stats.interface.js';
export declare class TaskCompletedEvent {
    readonly taskId: number;
    readonly completedAt: Date;
    readonly stats: ParsingStats;
    readonly skippedGroupIds: number[];
    constructor(taskId: number, completedAt: Date, stats: ParsingStats, skippedGroupIds: number[]);
}
