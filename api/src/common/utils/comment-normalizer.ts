import type { IComment } from '../../vk/interfaces/comment.interfaces';
import type { CommentEntity } from '../types/comment-entity.type';

export const normalizeComment = (comment: IComment): CommentEntity => {
  return {
    postId: comment.postId,
    ownerId: comment.ownerId,
    vkCommentId: comment.vkCommentId,
    fromId: comment.fromId,
    text: comment.text,
    publishedAt: comment.publishedAt,
    likesCount: comment.likesCount ?? null,
    parentsStack: comment.parentsStack ?? null,
    threadCount: comment.threadCount ?? null,
    threadItems: comment.threadItems?.length
      ? comment.threadItems.map((item) => normalizeComment(item))
      : null,
    attachments: comment.attachments ?? null,
    replyToUser: comment.replyToUser ?? null,
    replyToComment: comment.replyToComment ?? null,
    isDeleted: comment.isDeleted,
  };
};
