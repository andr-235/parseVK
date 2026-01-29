import type { CommentEntity } from '../../common/types/comment-entity.type.js';
import type { ParsingStats } from './parsing-stats.interface.js';

export type { CommentEntity };

export type TaskProcessingContext = {
  totalGroups: number;
  processedGroups: number;
  stats: ParsingStats;
  skippedGroupVkIds: number[];
  processedAuthorIds: Set<number>;
  failedGroups: Array<{ vkId: number; name: string; error: string }>;
};
