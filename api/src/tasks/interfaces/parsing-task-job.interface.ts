import type {
  ParsingScope,
  ParsingTaskMode,
} from '../dto/create-parsing-task.dto.js';

export interface ParsingTaskJobData {
  taskId: number;
  scope: ParsingScope;
  groupIds: number[];
  postLimit: number | null;
  mode: ParsingTaskMode;
}
