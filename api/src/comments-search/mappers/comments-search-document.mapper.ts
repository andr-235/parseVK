export interface CommentsSearchIndexEntity {
  id: number;
  postId: number;
  ownerId: number;
  vkCommentId: number;
  authorVkId: number | null;
  text: string;
  publishedAt: Date;
  source: string;
  isRead: boolean;
  author: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  post: {
    text: string;
    group: {
      vkId: number;
      name: string;
    } | null;
  };
  commentKeywordMatches: Array<{
    keyword: {
      id: number;
      word: string;
    };
  }>;
}

export interface CommentsSearchDocument {
  commentId: number;
  postId: number;
  ownerId: number;
  vkCommentId: number;
  authorVkId: number | null;
  groupId: number | null;
  publishedAt: string;
  source: string;
  isRead: boolean;
  commentText: string;
  postText: string;
  keywordIds: number[];
  keywordWords: string[];
  authorName: string | null;
  groupName: string | null;
}

export class CommentsSearchDocumentMapper {
  map(comment: CommentsSearchIndexEntity): CommentsSearchDocument {
    const authorName = [comment.author?.firstName, comment.author?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      commentId: comment.id,
      postId: comment.postId,
      ownerId: comment.ownerId,
      vkCommentId: comment.vkCommentId,
      authorVkId: comment.authorVkId,
      groupId: comment.post.group?.vkId ?? null,
      publishedAt: comment.publishedAt.toISOString(),
      source: comment.source,
      isRead: comment.isRead,
      commentText: comment.text,
      postText: comment.post.text,
      keywordIds: comment.commentKeywordMatches.map((item) => item.keyword.id),
      keywordWords: comment.commentKeywordMatches.map((item) => item.keyword.word),
      authorName: authorName || null,
      groupName: comment.post.group?.name ?? null,
    };
  }
}
