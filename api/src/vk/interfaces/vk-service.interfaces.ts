import type { Params, Responses } from 'vk-io';
import type { IComment } from './comment.interfaces.js';

export interface GetCommentsOptions {
  ownerId: number;
  postId: number;
  count?: number;
  offset?: number;
  sort?: Params.WallGetCommentsParams['sort'];
  previewLength?: number;
  commentId?: number;
  startCommentId?: number;
  threadItemsCount?: number;
  needLikes?: boolean;
  extended?: boolean;
  fields?: Params.WallGetCommentsParams['fields'];
}

export type GetCommentsResponse = Omit<
  Responses.WallGetCommentsExtendedResponse,
  'items'
> & {
  items: IComment[];
};

export interface VkPhotoSize {
  type: string;
  url: string;
  width: number;
  height: number;
}

export interface VkPhoto {
  id: number;
  owner_id: number;
  photo_id: string;
  album_id: number;
  date: number;
  text?: string;
  sizes: VkPhotoSize[];
}
