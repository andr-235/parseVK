import { OkFriendsGetService } from './services/ok-friends-get.service.js';
import type { OkFriendsGetParams, OkFriendsGetResponse } from './services/ok-friends-get.service.js';
import { OkUsersGetInfoService } from './services/ok-users-get-info.service.js';
import type { OkUsersGetInfoParams, OkUserInfo } from './services/ok-users-get-info.service.js';
export type { OkFriendsGetParams, OkFriendsGetResponse };
export type { OkUsersGetInfoParams, OkUserInfo };
export declare class OkApiService {
    private readonly friendsGetService;
    private readonly usersGetInfoService;
    constructor(friendsGetService: OkFriendsGetService, usersGetInfoService: OkUsersGetInfoService);
    friendsGet(params: OkFriendsGetParams): Promise<OkFriendsGetResponse>;
    usersGetInfo(params: OkUsersGetInfoParams): Promise<OkUserInfo[]>;
}
