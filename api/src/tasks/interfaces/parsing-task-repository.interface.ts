import type { ParsingScope } from '../dto/create-parsing-task.dto';

export type ParsingTaskRecord = {
  id: number;
  description: string | null;
  totalItems: number | null;
  processedItems: number | null;
  progress: number | null;
  completed: boolean | null;
};

export type ParsingGroupRecord = {
  id: number;
  vkId: number;
  name: string;
  wall: number | null;
};

export type TaskUpdateData = {
  status?: string;
  description?: string | null;
  completed?: boolean;
  totalItems?: number;
  processedItems?: number;
  progress?: number;
};

export type PostUpsertData = {
  ownerId: number;
  vkPostId: number;
  groupId: number;
  fromId: number;
  postedAt: Date;
  text: string;
  commentsCount: number;
  commentsCanPost: number;
  commentsGroupsCanPost: boolean;
  commentsCanClose: boolean;
  commentsCanOpen: boolean;
  attachments?: unknown;
};

export interface IParsingTaskRepository {
  findTaskById(taskId: number): Promise<ParsingTaskRecord | null>;
  updateTask(
    taskId: number,
    data: TaskUpdateData,
  ): Promise<ParsingTaskRecord | null>;
  updateTaskStatus(
    taskId: number,
    status: 'running' | 'failed',
  ): Promise<ParsingTaskRecord | null>;
  findGroups(
    scope: ParsingScope,
    groupIds: number[],
  ): Promise<ParsingGroupRecord[]>;
  updateGroupWall(groupId: number, wall: number): Promise<void>;
  upsertPost(data: PostUpsertData): Promise<void>;
}
