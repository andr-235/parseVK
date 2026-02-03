import type { ParsingScope } from '@/tasks/dto/create-parsing-task.dto.js';

export class ExecuteParsingTaskCommand {
  constructor(
    public readonly taskId: number,
    public readonly scope: ParsingScope,
    public readonly groupIds: number[],
    public readonly postLimit: number,
  ) {}
}
