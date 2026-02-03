import type { ParsingStats } from '@/tasks/interfaces/parsing-stats.interface.js';

export class UpdateTaskProgressCommand {
  constructor(
    public readonly taskId: number,
    public readonly processedItems: number,
    public readonly progress: number,
    public readonly status: string,
    public readonly stats?: ParsingStats,
  ) {}
}
