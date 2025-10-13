import type { CommentEntity } from '../../common/types/comment-entity.type';
import type { ParsingStats } from './parsing-stats.interface';

export type PrismaTaskRecord = {
  id: number;
  description?: string | null;
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

export type { CommentEntity };

export type TaskProcessingContext = {
  totalGroups: number;
  processedGroups: number;
  stats: ParsingStats;
  skippedGroupVkIds: number[];
  processedAuthorIds: Set<number>;
};
