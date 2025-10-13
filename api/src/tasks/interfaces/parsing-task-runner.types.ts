import type { ParsingStats } from './parsing-stats.interface';

export type PrismaTaskRecord = {
  id: number;
  totalItems?: number | null;
  processedItems?: number | null;
  progress?: number | null;
};

export type PrismaGroupRecord = {
  id: number;
  vkId: number;
  name: string;
  wall: number | null;
};

export type CommentEntity = {
  postId: number;
  ownerId: number;
  vkCommentId: number;
  fromId: number;
  text: string;
  publishedAt: Date;
  likesCount: number | null;
  parentsStack: number[] | null;
  threadCount: number | null;
  threadItems: CommentEntity[] | null;
  attachments: unknown | null;
  replyToUser: number | null;
  replyToComment: number | null;
  isDeleted: boolean;
};

export type TaskProcessingContext = {
  totalGroups: number;
  processedGroups: number;
  stats: ParsingStats;
  skippedGroupVkIds: number[];
  processedAuthorIds: Set<number>;
};
