import type { CommentEntity } from '../../common/types/comment-entity.type';

const COMMENT_KEY_SEPARATOR = ':';

export type CommentVisitor = (comment: CommentEntity) => void;

export const composeCommentKey = (
  ownerId: number,
  vkCommentId: number | null | undefined,
): string => `${ownerId}${COMMENT_KEY_SEPARATOR}${typeof vkCommentId === 'number' ? vkCommentId : 'null'}`;

export const walkCommentTree = (comment: CommentEntity, visitor: CommentVisitor): void => {
  visitor(comment);

  if (!comment.threadItems?.length) {
    return;
  }

  for (const item of comment.threadItems) {
    walkCommentTree(item, visitor);
  }
};
