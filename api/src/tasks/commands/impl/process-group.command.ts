import type { ParsingGroupRecord } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import type { TaskProcessingContext } from '@/tasks/interfaces/parsing-task-runner.types.js';
import { Command } from '@nestjs/cqrs';

export class ProcessGroupCommand extends Command<boolean> {
  constructor(
    public readonly group: ParsingGroupRecord,
    public readonly postLimit: number,
    public readonly context: TaskProcessingContext,
    public readonly taskId: number,
  ) {
    super();
  }
}
