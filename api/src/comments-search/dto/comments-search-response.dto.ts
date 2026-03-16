import type { CommentsSearchViewMode } from '../comments-search.types.js';

export interface CommentsSearchCommentItemDto {
  type: 'comment';
  commentId: number;
  postId: number | null;
  commentText: string;
  postText: string | null;
  highlight: string[];
}

export interface CommentsSearchPostItemDto {
  type: 'post';
  postId: number;
  postText: string | null;
  comments: CommentsSearchCommentItemDto[];
}

export type CommentsSearchItemDto =
  | CommentsSearchCommentItemDto
  | CommentsSearchPostItemDto;

export interface CommentsSearchResponseDto {
  source: 'elasticsearch' | 'fallback';
  viewMode: CommentsSearchViewMode;
  total: number;
  page: number;
  pageSize: number;
  items: CommentsSearchItemDto[];
}
