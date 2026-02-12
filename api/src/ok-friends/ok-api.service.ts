import { Injectable } from '@nestjs/common';
import { OkFriendsGetService } from './services/ok-friends-get.service.js';
import type {
  OkFriendsGetParams,
  OkFriendsGetResponse,
} from './services/ok-friends-get.service.js';
import { OkUsersGetInfoService } from './services/ok-users-get-info.service.js';
import type {
  OkUsersGetInfoParams,
  OkUserInfo,
} from './services/ok-users-get-info.service.js';

export type { OkFriendsGetParams, OkFriendsGetResponse };
export type { OkUsersGetInfoParams, OkUserInfo };

/**
 * Фасад для OK API.
 *
 * Делегирует в OkFriendsGetService и OkUsersGetInfoService.
 * Новый код должен инжектировать конкретные сервисы напрямую.
 */
@Injectable()
export class OkApiService {
  constructor(
    private readonly friendsGetService: OkFriendsGetService,
    private readonly usersGetInfoService: OkUsersGetInfoService,
  ) {}

  friendsGet(params: OkFriendsGetParams): Promise<OkFriendsGetResponse> {
    return this.friendsGetService.friendsGet(params);
  }

  usersGetInfo(params: OkUsersGetInfoParams): Promise<OkUserInfo[]> {
    return this.usersGetInfoService.usersGetInfo(params);
  }
}
