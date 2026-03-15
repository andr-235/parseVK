import type { ParsingGroupRecord } from '@/tasks/interfaces/parsing-task-repository.interface.js';
import type { TaskProcessingContext } from '@/tasks/interfaces/parsing-task-runner.types.js';
import { Command } from '@nestjs/cqrs';
import type { ParsingTaskMode } from '@/tasks/dto/create-parsing-task.dto.js';

export class ProcessGroupCommand extends Command<boolean> {
  constructor(
    public readonly group: ParsingGroupRecord,
    public readonly mode: ParsingTaskMode,
    public readonly postLimit: number | null,
    public readonly context: TaskProcessingContext,
    public readonly taskId: number,
  ) {
    super();
  }
}
