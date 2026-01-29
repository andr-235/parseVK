import type { IComment } from '../../vk/interfaces/comment.interfaces.js';
import type { CommentEntity } from '../types/comment-entity.type.js';

/**
 * Нормализует комментарий из формата VK API в формат приложения
 *
 * Рекурсивно обрабатывает вложенные комментарии (threadItems)
 * и преобразует структуру данных для сохранения в базу данных.
 *
 * @param comment - Комментарий из VK API
 * @returns Нормализованный комментарий
 */
export function normalizeComment(comment: IComment): CommentEntity {
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
    threadItems: normalizeThreadItems(comment.threadItems),
    attachments: comment.attachments ?? null,
    replyToUser: comment.replyToUser ?? null,
    replyToComment: comment.replyToComment ?? null,
    isDeleted: comment.isDeleted,
  };
}

/**
 * Нормализует вложенные комментарии (threadItems)
 *
 * @param threadItems - Массив вложенных комментариев или undefined
 * @returns Нормализованный массив или null
 */
function normalizeThreadItems(
  threadItems: IComment[] | undefined,
): CommentEntity[] | null {
  if (!threadItems?.length) {
    return null;
  }
  return threadItems.map((item) => normalizeComment(item));
}
