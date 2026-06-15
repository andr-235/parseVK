import type { OkFriendsParamsDto } from './dto/ok-friends.dto.js';
export interface OkFriendsGetParams {
    fid?: string;
    offset?: number;
    limit?: number;
}
export declare function buildParams(dto: OkFriendsParamsDto, overrides?: Partial<OkFriendsParamsDto>): OkFriendsGetParams;
