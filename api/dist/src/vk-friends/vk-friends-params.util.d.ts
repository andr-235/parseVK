import type { Params } from 'vk-io';
import type { VkFriendsParamsDto } from './dto/vk-friends.dto.js';
export declare function resolveFields(fields?: VkFriendsParamsDto['fields']): VkFriendsParamsDto['fields'];
export declare function buildParams(dto: VkFriendsParamsDto, overrides?: Partial<VkFriendsParamsDto>): Params.FriendsGetParams;
