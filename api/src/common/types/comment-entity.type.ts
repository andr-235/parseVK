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
  attachments: unknown;
  replyToUser: number | null;
  replyToComment: number | null;
  isDeleted: boolean;
};
