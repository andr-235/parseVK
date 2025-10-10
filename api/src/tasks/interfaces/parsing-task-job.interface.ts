import type { ParsingScope } from '../dto/create-parsing-task.dto';

export interface ParsingTaskJobData {
  taskId: number;
  scope: ParsingScope;
  groupIds: number[];
  postLimit: number;
}
