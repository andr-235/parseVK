import type { CommentEntity } from '../../common/types/comment-entity.type.js';
export type CommentVisitor = (comment: CommentEntity) => void;
export declare const composeCommentKey: (ownerId: number, vkCommentId: number | null | undefined) => string;
export declare const walkCommentTree: (comment: CommentEntity, visitor: CommentVisitor) => void;
