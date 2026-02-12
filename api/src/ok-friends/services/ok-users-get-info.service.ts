import { Injectable, Logger } from '@nestjs/common';
import {
  signOkRequestForUsersGetInfo,
  type OkApiParams,
} from '../ok-friends-signature.util.js';
import { OkAuthService } from './ok-auth.service.js';

export type OkUserInfo = Record<string, unknown>;

export interface OkUsersGetInfoParams {
  uids: string[];
  fields?: string[];
  emptyPictures?: boolean;
}

const OK_USERS_GET_INFO_FIELDS: string[] = [
  'accessible',
  'age',
  'allowed_for_ads_vk',
  'allows_anonym_access',
  'allows_messaging_only_for_friends',
  'allow_add_to_friend',
  'badge',
  'become_vip_allowed',
  'bio',
  'birthday',
  'blocked',
  'blocks',
  'block_on_demand',
  'bookmarked',
  'business',
  'can_use_referral_invite',
  'can_vcall',
  'can_vmail',
  'city_of_birth',
  'close_comments_allowed',
  'common_friends_count',
  'current_location',
  'current_status',
  'current_status_date',
  'current_status_date_ms',
  'current_status_id',
  'current_status_mood',
  'current_status_track_id',
  'dzen_token',
  'email',
  'executor',
  'external_share_link',
  'first_name',
  'first_name_instrumental',
  'followers_count',
  'forbids_mentioning',
  'friend',
  'friends_count',
  'friend_invitation',
  'friend_invite_allowed',
  'gender',
  'group_invite_allowed',
  'has_daily_photo',
  'has_email',
  'has_groups_to_comment',
  'has_moderating_groups',
  'has_phone',
  'has_pinned_feed',
  'has_products',
  'has_service_invisible',
  'hobby_expert',
  'hobby_topic',
  'internal_pic_allow_empty',
  'invited_by_friend',
  'is_merchant',
  'last_name',
  'last_name_instrumental',
  'last_online',
  'last_online_ms',
  'locale',
  'location',
  'location_of_birth',
  'modified_ms',
  'name',
  'name_instrumental',
  'new_user',
  'nn_photo_set_ids',
  'odkl_block_reason',
  'odkl_email',
  'odkl_login',
  'odkl_mobile',
  'odkl_mobile_activation_date',
  'odkl_mobile_status',
  'odkl_user_options',
  'odkl_user_status',
  'odkl_voting',
  'online',
  'partner_link_create_allowed',
  'photo_id',
  'pic1024x768',
  'pic128max',
  'pic128x128',
  'pic180min',
  'pic190x190',
  'pic224x224',
  'pic240min',
  'pic288x288',
  'pic320min',
  'pic50x50',
  'pic600x600',
  'pic640x480',
  'picgif',
  'picmp4',
  'picwebm',
  'pic_1',
  'pic_2',
  'pic_3',
  'pic_4',
  'pic_5',
  'pic_base',
  'pic_full',
  'pic_max',
  'possible_relations',
  'premium',
  'presents',
  'private',
  'profile_buttons',
  'profile_cover',
  'profile_photo_suggest_allowed',
  'pymk_pic224x224',
  'pymk_pic288x288',
  'pymk_pic600x600',
  'pymk_pic_full',
  'ref',
  'registered_date',
  'registered_date_ms',
  'relations',
  'relationship',
  'returning',
  'rkn_mark',
  'send_message_allowed',
  'shortname',
  'show_lock',
  'skill',
  'status',
  'total_photos_count',
  'uid',
  'update_photos_with_me_checked_time',
  'url_chat',
  'url_chat_mobile',
  'url_profile',
  'url_profile_mobile',
  'vip',
  'vk_id',
];

const OK_USERS_GET_INFO_FIELDS_SET = new Set(OK_USERS_GET_INFO_FIELDS);

/** Максимальное количество uid в одном запросе к users.getInfo */
const MAX_UIDS_PER_REQUEST = 100;

/**
 * Сервис для получения информации о пользователях через OK API (users.getInfo).
 */
@Injectable()
export class OkUsersGetInfoService {
  private readonly logger = new Logger(OkUsersGetInfoService.name);

  constructor(private readonly auth: OkAuthService) {}

  async usersGetInfo(params: OkUsersGetInfoParams): Promise<OkUserInfo[]> {
    this.auth.assertCredentialsAvailable();

    if (!params.uids || params.uids.length === 0) {
      throw new Error('uids parameter is required and must not be empty');
    }

    if (params.uids.length > MAX_UIDS_PER_REQUEST) {
      throw new Error(
        `uids parameter must contain at most ${MAX_UIDS_PER_REQUEST} user IDs per request`,
      );
    }

    const { accessToken, applicationKey, applicationSecretKey } =
      this.auth.getCredentials();

    const apiParams: OkApiParams = {
      application_key: applicationKey,
      method: 'users.getInfo',
      format: 'json',
      uids: params.uids.join(','),
    };

    apiParams.fields = this.resolveFields(params.fields);

    if (params.emptyPictures !== undefined) {
      apiParams.emptyPictures = params.emptyPictures ? 'true' : 'false';
    }

    if (!apiParams.fields) {
      this.logger.error(
        'OK API users.getInfo: fields is missing before signature calculation!',
      );
      apiParams.fields = OK_USERS_GET_INFO_FIELDS.join(',');
    }

    // ВАЖНО: для users.getInfo session_key ВКЛЮЧАЕТСЯ в подпись
    const paramsForSignature: OkApiParams = {
      ...apiParams,
      session_key: accessToken,
    };
    this.logger.log(
      `OK API users.getInfo params for signature: ${JSON.stringify(paramsForSignature)}`,
    );
    const sig = signOkRequestForUsersGetInfo(
      paramsForSignature,
      accessToken,
      applicationSecretKey,
    );
    this.logger.log(`OK API users.getInfo sig: ${sig.substring(0, 8)}...`);

    const queryParams = new URLSearchParams();
    queryParams.append('application_key', applicationKey);
    queryParams.append('method', 'users.getInfo');
    queryParams.append('format', 'json');
    queryParams.append('uids', params.uids.join(','));
    queryParams.append('fields', apiParams.fields);

    if (apiParams.emptyPictures !== undefined) {
      queryParams.append('emptyPictures', String(apiParams.emptyPictures));
    }
    queryParams.append('sig', sig);
    if (accessToken) queryParams.append('session_key', accessToken);

    const url = `https://api.ok.ru/fb.do?${queryParams.toString()}`;
    const maskedUrl = url.replace(/session_key=[^&]+/g, 'session_key=***');
    this.logger.log(`OK API users.getInfo request URL: ${maskedUrl}`);
    this.logger.log(
      `OK API users.getInfo params: uids count=${params.uids.length}, fields=${(apiParams.fields ?? '').substring(0, 100)}`,
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `OK API users.getInfo error: ${response.status} ${response.statusText} - ${errorText}`,
        );
        throw new Error(
          `OK API users.getInfo request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as unknown;

      if (!data || typeof data !== 'object') {
        throw new Error('OK API users.getInfo returned invalid response');
      }

      this.checkApiError(data);

      if (Array.isArray(data)) {
        this.logger.log(`OK API users.getInfo returned ${data.length} users`);
        return data as OkUserInfo[];
      }

      if ('users' in data && Array.isArray(data.users)) {
        this.logger.log(
          `OK API users.getInfo returned ${(data.users as unknown[]).length} users`,
        );
        return data.users as OkUserInfo[];
      }

      this.logger.error(
        `OK API users.getInfo returned invalid response format. Response structure: ${JSON.stringify(data).substring(0, 500)}`,
      );
      throw new Error('OK API users.getInfo returned invalid response format');
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `OK API users.getInfo request failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
      throw new Error('OK API users.getInfo request failed: Unknown error');
    }
  }

  private resolveFields(fields?: string[]): string {
    if (!fields || fields.length === 0) {
      this.logger.log(
        `OK API users.getInfo: using all available fields (${OK_USERS_GET_INFO_FIELDS.length} fields)`,
      );
      return OK_USERS_GET_INFO_FIELDS.join(',');
    }

    const normalized = fields
      .map((f) => f.trim().toLowerCase())
      .filter((f) => f.length > 0);

    const validFields: string[] = [];
    const invalidFields: string[] = [];
    const seen = new Set<string>();

    for (const field of normalized) {
      if (!OK_USERS_GET_INFO_FIELDS_SET.has(field)) {
        invalidFields.push(field);
        continue;
      }
      if (!seen.has(field)) {
        seen.add(field);
        validFields.push(field);
      }
    }

    if (invalidFields.length > 0) {
      this.logger.warn(
        `OK API users.getInfo: ignoring unsupported fields (${invalidFields.length}): ${invalidFields.join(', ')}`,
      );
    }

    if (validFields.length === 0) {
      this.logger.log(
        `OK API users.getInfo: provided fields empty or invalid, using default list (${OK_USERS_GET_INFO_FIELDS.length} fields)`,
      );
      return OK_USERS_GET_INFO_FIELDS.join(',');
    }

    this.logger.log(
      `OK API users.getInfo: using provided fields (${validFields.length} fields)`,
    );
    return validFields.join(',');
  }

  private checkApiError(data: object): void {
    if ('error' in data && data.error) {
      const errorData = data.error as {
        error_code?: number;
        error_msg?: string;
      };
      this.logger.error(
        `OK API users.getInfo error: ${errorData.error_code} - ${errorData.error_msg}`,
      );
      throw new Error(
        `OK API users.getInfo error: ${errorData.error_msg ?? 'Unknown error'}`,
      );
    }

    if ('error_code' in data && data.error_code) {
      const errorResponse = data as { error_code: number; error_msg?: string };
      const errorMsg = errorResponse.error_msg ?? 'Unknown error';
      this.logger.error(
        `OK API users.getInfo error: ${errorResponse.error_code} - ${errorMsg}`,
      );
      throw new Error(`OK API users.getInfo error: ${errorMsg}`);
    }
  }
}
