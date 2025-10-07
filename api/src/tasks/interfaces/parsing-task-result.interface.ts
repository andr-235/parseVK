import { ParsingScope } from '../dto/create-parsing-task.dto';

export interface ParsingStats {
  groups: number;
  posts: number;
  comments: number;
  authors: number;
}

export interface ParsingTaskResult {
  taskId: number;
  scope: ParsingScope;
  postLimit: number;
  stats: ParsingStats;
  skippedGroupsMessage?: string;
}
