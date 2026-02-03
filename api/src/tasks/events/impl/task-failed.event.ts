import type { ParsingStats } from '@/tasks/interfaces/parsing-stats.interface.js';

export class TaskFailedEvent {
  constructor(
    public readonly taskId: number,
    public readonly failedAt: Date,
    public readonly error: string,
    public readonly stats?: ParsingStats,
  ) {}
}
