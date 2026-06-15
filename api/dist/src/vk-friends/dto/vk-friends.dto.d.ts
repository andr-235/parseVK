import type { Objects } from 'vk-io';
export interface FriendFlatDto {
    id: number | null;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    domain: string | null;
    bdate: string | null;
    sex: number | null;
    status: string | null;
    online: boolean | null;
    last_seen_time: string | null;
    last_seen_platform: number | null;
    city_id: number | null;
    city_title: string | null;
    country_id: number | null;
    country_title: string | null;
    has_mobile: boolean | null;
    can_post: boolean | null;
    can_see_all_posts: boolean | null;
    can_write_private_message: boolean | null;
    timezone: number | null;
    photo_50: string | null;
    photo_100: string | null;
    photo_200_orig: string | null;
    photo_id: string | null;
    relation: number | null;
    contacts_mobile_phone: string | null;
    contacts_home_phone: string | null;
    education_university: number | null;
    education_faculty: number | null;
    education_graduation: number | null;
    universities: string | null;
}
declare const FRIENDS_ORDER_VALUES: readonly ["hints", "mobile", "name", "random", "smart"];
declare const NAME_CASE_VALUES: readonly ["nom", "gen", "dat", "acc", "ins", "abl"];
export declare class VkFriendsParamsDto {
    user_id?: number;
    order?: (typeof FRIENDS_ORDER_VALUES)[number];
    list_id?: number;
    count?: number;
    offset?: number;
    fields?: Objects.UsersFields[];
    name_case?: (typeof NAME_CASE_VALUES)[number];
    ref?: string;
}
export declare class VkFriendsExportRequestDto {
    params: VkFriendsParamsDto;
}
export {};
