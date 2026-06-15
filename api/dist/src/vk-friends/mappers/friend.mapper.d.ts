import type { Objects } from 'vk-io';
import type { FriendFlatDto } from '../dto/vk-friends.dto.js';
export type VkUserInput = Objects.UsersUserFull | Objects.UsersUserMin | Record<string, unknown> | number | null | undefined;
export declare class FriendMapper {
    mapVkUserToFlatDto(vkUser: VkUserInput): FriendFlatDto;
    private asRecord;
    private toString;
    private toNumber;
    private toBoolean;
    private toIsoString;
    private toJsonString;
}
