import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
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
  raw_json: string | null;
}

const FRIENDS_ORDER_VALUES = [
  'hints',
  'mobile',
  'name',
  'random',
  'smart',
] as const;

const NAME_CASE_VALUES = ['nom', 'gen', 'dat', 'acc', 'ins', 'abl'] as const;

const normalizeStringArray = ({ value }: { value: unknown }) => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return value;
};

export class VkFriendsParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @IsOptional()
  @IsIn(FRIENDS_ORDER_VALUES)
  order?: (typeof FRIENDS_ORDER_VALUES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  list_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5000)
  count?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(normalizeStringArray)
  @IsArray()
  @IsString({ each: true })
  fields?: Objects.UsersFields[];

  @IsOptional()
  @IsIn(NAME_CASE_VALUES)
  name_case?: (typeof NAME_CASE_VALUES)[number];

  @IsOptional()
  @IsString()
  ref?: string;
}

export class VkFriendsExportRequestDto {
  @ValidateNested()
  @Type(() => VkFriendsParamsDto)
  params!: VkFriendsParamsDto;

  @IsOptional()
  @IsBoolean()
  exportDocx?: boolean;

  @IsOptional()
  @IsBoolean()
  includeRawJson?: boolean;
}
