import type { ParsingScope } from '../dto/create-parsing-task.dto';
import type { ParsingStats } from './parsing-task-result.interface';

export type TaskStatus = 'pending' | 'running' | 'done' | 'failed';

export interface TaskSummary {
  id: number;
  title: string;
  status: TaskStatus;
  completed: boolean;
  totalItems: number;
  processedItems: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  scope: ParsingScope | null;
  groupIds: number[];
  postLimit: number | null;
  stats: ParsingStats | null;
  error: string | null;
  skippedGroupsMessage: string | null;
}

export interface TaskDetail extends TaskSummary {
  description: string | null;
}
