import type {
  ParsingScope,
  ParsingTaskMode,
} from '../../../tasks/dto/create-parsing-task.dto.js';

export class CreateParsingTaskCommand {
  constructor(
    public readonly scope?: ParsingScope,
    public readonly groupIds?: number[],
    public readonly postLimit?: number,
    public readonly mode?: ParsingTaskMode,
  ) {}
}
