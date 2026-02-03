import type { CommentEntity } from '@/tasks/interfaces/parsing-task-runner.types.js';
import type { CommentSource } from '@/common/types/comment-source.enum.js';

export class SaveCommentsCommand {
  constructor(
    public readonly comments: CommentEntity[],
    public readonly source: CommentSource,
  ) {}
}
