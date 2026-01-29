import type { OkFriendsParamsDto } from './dto/ok-friends.dto.js';

export interface OkFriendsGetParams {
  fid?: string;
  offset?: number;
  limit?: number;
}

export function buildParams(
  dto: OkFriendsParamsDto,
  overrides?: Partial<OkFriendsParamsDto>,
): OkFriendsGetParams {
  return {
    fid: overrides?.fid ?? dto.fid,
    offset: overrides?.offset ?? dto.offset,
    limit: overrides?.limit ?? dto.limit,
  };
}
