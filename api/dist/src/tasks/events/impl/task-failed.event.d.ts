import type { ParsingStats } from '../../../tasks/interfaces/parsing-stats.interface.js';
export declare class TaskFailedEvent {
    readonly taskId: number;
    readonly failedAt: Date;
    readonly error: string;
    readonly stats?: ParsingStats | undefined;
    constructor(taskId: number, failedAt: Date, error: string, stats?: ParsingStats | undefined);
}
