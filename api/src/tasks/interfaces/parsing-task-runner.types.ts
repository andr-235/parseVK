import type { CommentEntity } from '../../common/types/comment-entity.type';
import type { ParsingStats } from './parsing-stats.interface';

export type { CommentEntity };

export type TaskProcessingContext = {
  totalGroups: number;
  processedGroups: number;
  stats: ParsingStats;
  skippedGroupVkIds: number[];
  processedAuthorIds: Set<number>;
  failedGroups: Array<{ vkId: number; name: string; error: string }>;
};
