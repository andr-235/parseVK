import type { ParsingScope } from '@/tasks/dto/create-parsing-task.dto.js';

export class CreateParsingTaskCommand {
  constructor(
    public readonly scope?: ParsingScope,
    public readonly groupIds?: number[],
    public readonly postLimit?: number,
  ) {}
}
