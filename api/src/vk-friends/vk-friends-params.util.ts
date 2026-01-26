import type { VkFriendsParamsDto } from './dto/vk-friends.dto';

const DEFAULT_FRIEND_FIELDS: VkFriendsParamsDto['fields'] = [
  'nickname',
  'domain',
  'bdate',
  'sex',
  'status',
  'online',
  'last_seen',
  'city',
  'country',
  'has_mobile',
  'can_post',
  'can_see_all_posts',
  'can_write_private_message',
  'timezone',
  'photo_50',
  'photo_100',
  'photo_200_orig',
  'photo_id',
  'relation',
  'contacts',
  'education',
  'universities',
];

export function resolveFields(
  fields?: VkFriendsParamsDto['fields'],
): VkFriendsParamsDto['fields'] {
  if (!Array.isArray(fields) || fields.length === 0) {
    return DEFAULT_FRIEND_FIELDS;
  }
  return fields;
}

export function buildParams(
  dto: VkFriendsParamsDto,
  overrides?: Partial<VkFriendsParamsDto>,
): VkFriendsParamsDto {
  const fields = overrides?.fields ?? dto.fields;
  return {
    user_id: overrides?.user_id ?? dto.user_id,
    order: overrides?.order ?? dto.order,
    list_id: overrides?.list_id ?? dto.list_id,
    count: overrides?.count ?? dto.count,
    offset: overrides?.offset ?? dto.offset,
    fields: resolveFields(fields),
    name_case: overrides?.name_case ?? dto.name_case,
    ref: overrides?.ref ?? dto.ref,
  };
}
