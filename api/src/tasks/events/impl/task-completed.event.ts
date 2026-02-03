import type { ParsingStats } from '@/tasks/interfaces/parsing-stats.interface.js';

export class TaskCompletedEvent {
  constructor(
    public readonly taskId: number,
    public readonly completedAt: Date,
    public readonly stats: ParsingStats,
    public readonly skippedGroupIds: number[],
  ) {}
}
