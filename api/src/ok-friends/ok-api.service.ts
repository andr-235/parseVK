import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/app.config';
import { OK_API_BASE_URL } from './ok-friends.constants';
import {
  signOkRequest,
  signOkRequestForUsersGetInfo,
  type OkApiParams,
} from './ok-friends-signature.util';

export interface OkFriendsGetParams {
  fid?: string;
  offset?: number;
  limit?: number;
}

export interface OkFriendsGetResponse {
  friends: string[];
}

export interface OkUsersGetInfoParams {
  uids: string[];
  fields?: string[];
  emptyPictures?: boolean;
}

export type OkUserInfo = Record<string, unknown>;

/**
 * Сервис для работы с OK API
 *
 * Требуемые переменные окружения:
 * - OK_ACCESS_TOKEN - вечный session_key из раздела "Access token" настроек приложения OK.ru
 *   (это "Вечный session_key", а не access_token - для приложений типа "Игра" используется session_key)
 * - OK_APPLICATION_KEY - публичный ключ приложения (application_key)
 *   (находится в основных настройках приложения)
 * - OK_APPLICATION_SECRET_KEY - секретный ключ приложения (application_secret_key)
 *   (находится в основных настройках приложения, можно восстановить через "Восстановить секретный ключ")
 *
 * Важно:
 * - session_secret_key вычисляется автоматически как MD5(session_key + application_secret_key).toLowerCase()
 * - session_key не включается в параметры для подписи запроса
 * - Для приложений типа "Игра" используется session_key, а не access_token
 */
@Injectable()
export class OkApiService {
  private readonly logger = new Logger(OkApiService.name);
  private readonly accessToken: string;
  private readonly applicationKey: string;
  private readonly applicationSecretKey: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    this.accessToken =
      this.configService.get('okAccessToken', { infer: true }) ?? '';
    this.applicationKey =
      this.configService.get('okApplicationKey', { infer: true }) ?? '';
    this.applicationSecretKey =
      this.configService.get('okApplicationSecretKey', { infer: true }) ?? '';

    // Валидация application_key - не должен содержать кириллицу
    if (this.applicationKey && /[А-Яа-яЁё]/.test(this.applicationKey)) {
      this.logger.error(
        `OK_APPLICATION_KEY contains Cyrillic characters! Current value: ${this.applicationKey}. This is invalid. Please update OK_APPLICATION_KEY to the correct value without Cyrillic characters.`,
      );
      throw new Error(
        'OK_APPLICATION_KEY contains invalid characters (Cyrillic). Please update the environment variable.',
      );
    }

    // Детальное логирование для диагностики
    this.logger.log(
      `[OK API INIT] accessToken=${this.accessToken ? `set (length: ${this.accessToken.length}, starts with: ${this.accessToken.substring(0, 5)})` : 'NOT SET'}`,
    );
    this.logger.log(
      `[OK API INIT] applicationKey=${this.applicationKey ? `set (${this.applicationKey})` : 'NOT SET'}`,
    );
    this.logger.log(
      `[OK API INIT] applicationSecretKey=${this.applicationSecretKey ? `set (length: ${this.applicationSecretKey.length})` : 'NOT SET'}`,
    );

    if (
      !this.accessToken ||
      !this.applicationKey ||
      !this.applicationSecretKey
    ) {
      this.logger.error(
        'OK API credentials not configured. Set OK_ACCESS_TOKEN (вечный session_key), OK_APPLICATION_KEY, OK_APPLICATION_SECRET_KEY',
      );
      this.logger.error(
        `Current values: accessToken=${this.accessToken ? 'set' : 'empty'}, applicationKey=${this.applicationKey || 'empty'}, applicationSecretKey=${this.applicationSecretKey ? 'set' : 'empty'}`,
      );
    }
  }

  async friendsGet(params: OkFriendsGetParams): Promise<OkFriendsGetResponse> {
    // Проверка наличия всех необходимых данных перед запросом
    if (!this.applicationKey) {
      this.logger.error('OK_APPLICATION_KEY is not set!');
      throw new Error('OK_APPLICATION_KEY is not configured');
    }
    if (!this.accessToken) {
      this.logger.error('OK_ACCESS_TOKEN (вечный session_key) is not set!');
      throw new Error('OK_ACCESS_TOKEN (вечный session_key) is not configured');
    }
    if (!this.applicationSecretKey) {
      this.logger.error('OK_APPLICATION_SECRET_KEY is not set!');
      throw new Error('OK_APPLICATION_SECRET_KEY is not configured');
    }

    // Формируем параметры запроса (без access_token - он добавляется отдельно)
    const apiParams: OkApiParams = {
      application_key: this.applicationKey,
      method: 'friends.get',
      format: 'json',
    };

    if (params.fid !== undefined) {
      apiParams.fid = params.fid;
    }

    if (params.offset !== undefined) {
      apiParams.offset = String(params.offset);
    }

    if (params.limit !== undefined) {
      apiParams.limit = String(params.limit);
    }

    // Вычисляем подпись (access_token не включается в параметры для подписи)
    const sig = signOkRequest(
      apiParams,
      this.accessToken,
      this.applicationSecretKey,
    );

    // Формируем query параметры для запроса
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(apiParams)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }
    queryParams.append('sig', sig);
    // Для приложений типа "Игра" используется session_key из настроек приложения
    // Это "Вечный session_key" из раздела "Access token" настроек приложения
    if (this.accessToken) {
      queryParams.append('session_key', this.accessToken);
    }

    const url = `${OK_API_BASE_URL}/friends/get?${queryParams.toString()}`;

    // Детальное логирование для отладки (без секретных данных)
    const maskedUrl = url.replace(/access_token=[^&]+/, 'access_token=***');
    this.logger.log(`OK API request URL: ${maskedUrl}`);
    this.logger.log(
      `OK API params: application_key=${this.applicationKey}, method=${apiParams.method}, format=${apiParams.format}, fid=${params.fid ?? 'undefined'}, offset=${params.offset ?? 'undefined'}, limit=${params.limit ?? 'undefined'}, sig=${sig.substring(0, 8)}...`,
    );
    this.logger.log(
      `OK API credentials: accessToken=${this.accessToken ? `set (${this.accessToken.substring(0, 10)}...)` : 'NOT SET'}, applicationKey=${this.applicationKey || 'NOT SET'}, applicationSecretKey=${this.applicationSecretKey ? 'set' : 'NOT SET'}`,
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `OK API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
        throw new Error(
          `OK API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as unknown;

      if (!data || typeof data !== 'object') {
        this.logger.error(
          `OK API returned invalid response type: ${typeof data}`,
        );
        throw new Error('OK API returned invalid response');
      }

      // Проверяем формат ошибки OK API (может быть в разных форматах)
      if ('error' in data && data.error) {
        const errorData = data.error as {
          error_code?: number;
          error_msg?: string;
        };
        this.logger.error(
          `OK API error: ${errorData.error_code} - ${errorData.error_msg}`,
        );
        throw new Error(
          `OK API error: ${errorData.error_msg ?? 'Unknown error'}`,
        );
      }

      // OK API может возвращать ошибки напрямую в объекте ответа
      if ('error_code' in data && data.error_code) {
        const errorResponse = data as {
          error_code: number;
          error_msg?: string;
          error_data?: unknown;
        };
        const errorCode = errorResponse.error_code;
        const errorMsg = errorResponse.error_msg ?? 'Unknown error';
        this.logger.error(`OK API error: ${errorCode} - ${errorMsg}`);
        throw new Error(`OK API error: ${errorMsg}`);
      }

      // Логируем структуру ответа для отладки
      this.logger.log(`OK API response keys: ${Object.keys(data).join(', ')}`);
      this.logger.log(
        `OK API response sample: ${JSON.stringify(data).substring(0, 500)}`,
      );

      // OK API может возвращать друзей в разных форматах
      // Проверяем различные возможные варианты структуры ответа
      let friendsArray: unknown[] | null = null;

      if ('friends' in data && Array.isArray(data.friends)) {
        friendsArray = data.friends;
      } else if ('uids' in data && Array.isArray(data.uids)) {
        // Альтернативный формат ответа
        friendsArray = data.uids;
      } else if (Array.isArray(data)) {
        // Прямой массив ID
        friendsArray = data;
      }

      if (!friendsArray) {
        this.logger.error(
          `OK API returned invalid friends array. Response structure: ${JSON.stringify(data).substring(0, 500)}`,
        );
        throw new Error('OK API returned invalid response format');
      }

      return {
        friends: friendsArray
          .map((id) => {
            // Преобразуем ID в строку (OK API может возвращать числа или строки)
            if (typeof id === 'number') {
              return String(id);
            }
            if (typeof id === 'string') {
              return id;
            }
            if (typeof id === 'bigint') {
              return id.toString();
            }
            return null;
          })
          .filter((id): id is string => id !== null),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `OK API request failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
      throw new Error('OK API request failed: Unknown error');
    }
  }

  async usersGetInfo(params: OkUsersGetInfoParams): Promise<OkUserInfo[]> {
    // Проверка наличия всех необходимых данных перед запросом
    if (!this.applicationKey) {
      this.logger.error('OK_APPLICATION_KEY is not set!');
      throw new Error('OK_APPLICATION_KEY is not configured');
    }
    if (!this.accessToken) {
      this.logger.error('OK_ACCESS_TOKEN (вечный session_key) is not set!');
      throw new Error('OK_ACCESS_TOKEN (вечный session_key) is not configured');
    }
    if (!this.applicationSecretKey) {
      this.logger.error('OK_APPLICATION_SECRET_KEY is not set!');
      throw new Error('OK_APPLICATION_SECRET_KEY is not configured');
    }

    if (!params.uids || params.uids.length === 0) {
      throw new Error('uids parameter is required and must not be empty');
    }

    if (params.uids.length > 100) {
      throw new Error(
        'uids parameter must contain at most 100 user IDs per request',
      );
    }

    // Формируем параметры запроса
    const apiParams: OkApiParams = {
      application_key: this.applicationKey,
      method: 'users.getInfo',
      format: 'json',
      uids: params.uids.join(','),
    };

    // Параметр fields обязателен для users.getInfo
    // Если fields не указан, используем список всех доступных полей из документации
    if (params.fields && params.fields.length > 0) {
      apiParams.fields = params.fields.join(',');
      this.logger.log(
        `OK API users.getInfo: using provided fields (${params.fields.length} fields)`,
      );
    } else {
      // Список всех доступных полей из документации OK API users.getInfo
      // Для получения всей доступной информации передаем все поля
      const allFields = [
        'accessible',
        'age',
        'allow_add_to_friend',
        'allowed_for_ads_vk',
        'allows_anonym_access',
        'allows_messaging_only_for_friends',
        'badge_id',
        'badge_img',
        'badge_link',
        'badge_title',
        'bio',
        'birthday',
        'birthdaySet',
        'block_on_demand_reason',
        'block_on_demand_reason_tokens',
        'blocked',
        'blocks',
        'bookmarked',
        'business',
        'can_use_referral_invite',
        'can_vcall',
        'can_vmail',
        'capabilities',
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
        'email',
        'executor',
        'external_share_link',
        'feed_subscription',
        'first_name',
        'first_name_instrumental',
        'followers_count',
        'forbids_mentioning',
        'friend',
        'friend_invitation',
        'friends_count',
        'gender',
        'has_daily_photo',
        'has_email',
        'has_extended_stats',
        'has_groups_to_comment',
        'has_moderating_groups',
        'has_phone',
        'has_pinned_feed',
        'has_products',
        'has_service_invisible',
        'has_unseen_daily_photo',
        'invited_by_friend',
        'is_hobby_expert',
        'is_merchant',
        'is_new_user',
        'is_returning',
        'last_name',
        'last_name_instrumental',
        'last_online',
        'last_online_ms',
        'locale',
        'location',
        'location_of_birth',
        'login',
        'mobile',
        'mobile_activation_date_ms',
        'modified_ms',
        'name',
        'name_instrumental',
        'nn_photo_set_ids',
        'notifications_subscription',
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
        'pic_1',
        'pic_2',
        'pic_3',
        'pic_4',
        'pic_5',
        'pic_base',
        'pic_full',
        'pic_max',
        'picgif',
        'picmp4',
        'picwebm',
        'possible_relations',
        'premium',
        'presents',
        'private',
        'profile_buttons',
        'profile_cover',
        'ref',
        'registered_date',
        'registered_date_ms',
        'relations',
        'relationship',
        'rkn_mark',
        'shortname',
        'show_lock',
        'skill',
        'social_aliases',
        'status',
        'total_photos_count',
        'uid',
        'url_chat',
        'url_chat_mobile',
        'url_profile',
        'url_profile_mobile',
        'vip',
        'vk_id',
      ];
      apiParams.fields = allFields.join(',');
      this.logger.log(
        `OK API users.getInfo: using all available fields (${allFields.length} fields)`,
      );
    }

    if (params.emptyPictures !== undefined) {
      apiParams.emptyPictures = params.emptyPictures ? 'true' : 'false';
    }

    // Проверяем, что fields установлен перед вычислением подписи
    if (!apiParams.fields) {
      this.logger.error(
        'OK API users.getInfo: fields is missing before signature calculation!',
      );
      // Fallback: используем минимальный набор полей
      const allFields = [
        'uid',
        'first_name',
        'last_name',
        'name',
        'pic50x50',
        'pic128x128',
        'pic190x190',
        'pic640x480',
        'location',
        'age',
        'gender',
        'birthday',
        'online',
        'last_online',
        'status',
        'current_status',
        'url_profile',
        'url_profile_mobile',
        'url_chat',
        'url_chat_mobile',
        'email',
        'mobile',
        'has_email',
        'has_phone',
        'friends_count',
        'followers_count',
        'common_friends_count',
        'registered_date',
        'locale',
        'vip',
        'premium',
        'private',
        'blocked',
        'friend',
        'friend_invitation',
        'bookmarked',
        'can_vcall',
        'can_vmail',
        'location_of_birth',
        'city_of_birth',
        'current_location',
        'relations',
        'relationship',
        'skill',
        'social_aliases',
        'presents',
        'profile_cover',
        'nn_photo_set_ids',
        'rkn_mark',
        'status',
        'business',
        'executor',
        'ref',
        'shortname',
        'login',
        'bio',
        'badge_id',
        'badge_img',
        'badge_link',
        'badge_title',
        'accessible',
        'allow_add_to_friend',
        'allowed_for_ads_vk',
        'allows_anonym_access',
        'allows_messaging_only_for_friends',
        'block_on_demand_reason',
        'block_on_demand_reason_tokens',
        'blocks',
        'can_use_referral_invite',
        'capabilities',
        'close_comments_allowed',
        'current_status_date',
        'current_status_date_ms',
        'current_status_id',
        'current_status_mood',
        'current_status_track_id',
        'external_share_link',
        'feed_subscription',
        'first_name_instrumental',
        'forbids_mentioning',
        'has_daily_photo',
        'has_extended_stats',
        'has_groups_to_comment',
        'has_moderating_groups',
        'has_pinned_feed',
        'has_products',
        'has_service_invisible',
        'has_unseen_daily_photo',
        'invited_by_friend',
        'is_hobby_expert',
        'is_merchant',
        'is_new_user',
        'is_returning',
        'last_name_instrumental',
        'last_online_ms',
        'mobile_activation_date_ms',
        'modified_ms',
        'name_instrumental',
        'notifications_subscription',
        'partner_link_create_allowed',
        'photo_id',
        'pic1024x768',
        'pic128max',
        'pic180min',
        'pic224x224',
        'pic240min',
        'pic288x288',
        'pic320min',
        'pic600x600',
        'pic_1',
        'pic_2',
        'pic_3',
        'pic_4',
        'pic_5',
        'pic_base',
        'pic_full',
        'pic_max',
        'picgif',
        'picmp4',
        'picwebm',
        'possible_relations',
        'profile_buttons',
        'registered_date_ms',
        'show_lock',
        'total_photos_count',
        'vk_id',
      ];
      apiParams.fields = allFields.join(',');
      this.logger.log(
        `OK API users.getInfo: fields set via fallback (${allFields.length} fields)`,
      );
    }

    // Вычисляем подпись
    // ВАЖНО: для users.getInfo session_key ВКЛЮЧАЕТСЯ в подпись (в отличие от friends.get)
    // Добавляем session_key в параметры для подписи
    const paramsForSignature: OkApiParams = {
      ...apiParams,
      session_key: this.accessToken,
    };

    // Логируем параметры для подписи для отладки
    this.logger.log(
      `OK API users.getInfo params for signature: ${JSON.stringify(paramsForSignature)}`,
    );
    const sig = signOkRequestForUsersGetInfo(
      paramsForSignature,
      this.accessToken,
      this.applicationSecretKey,
    );
    this.logger.log(`OK API users.getInfo sig: ${sig.substring(0, 8)}...`);

    // Формируем query параметры для запроса
    const queryParams = new URLSearchParams();

    // Явно добавляем все обязательные параметры
    queryParams.append('application_key', this.applicationKey);
    queryParams.append('method', 'users.getInfo');
    queryParams.append('format', 'json');
    queryParams.append('uids', params.uids.join(','));

    // Параметр fields обязателен - явно добавляем его
    if (!apiParams.fields) {
      this.logger.error(
        'OK API users.getInfo: fields is missing in apiParams, this should not happen!',
      );
      // Fallback: используем минимальный набор полей
      apiParams.fields = 'uid,first_name,last_name';
    }
    queryParams.append('fields', apiParams.fields);
    this.logger.log(
      `OK API users.getInfo: fields parameter explicitly added: ${apiParams.fields.substring(0, 100)}...`,
    );

    // Добавляем остальные опциональные параметры
    if (apiParams.emptyPictures !== undefined) {
      const emptyPicturesValue =
        typeof apiParams.emptyPictures === 'string'
          ? apiParams.emptyPictures
          : String(apiParams.emptyPictures);
      queryParams.append('emptyPictures', emptyPicturesValue);
    }

    queryParams.append('sig', sig);
    if (this.accessToken) {
      queryParams.append('session_key', this.accessToken);
    }

    // Для users.getInfo используется fb.do, а не /users/getInfo
    const url = `https://api.ok.ru/fb.do?${queryParams.toString()}`;

    // Детальное логирование для отладки
    const maskedUrl = url.replace(/session_key=[^&]+/g, 'session_key=***');
    this.logger.log(`OK API users.getInfo request URL: ${maskedUrl}`);
    this.logger.log(
      `OK API users.getInfo params: application_key=${this.applicationKey}, method=users.getInfo, format=json, uids count=${params.uids.length}, fields=${apiParams.fields || 'NOT SET'}`,
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
        this.logger.error(
          `OK API users.getInfo returned invalid response type: ${typeof data}`,
        );
        throw new Error('OK API users.getInfo returned invalid response');
      }

      // Проверяем формат ошибки OK API
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
        const errorResponse = data as {
          error_code: number;
          error_msg?: string;
          error_data?: unknown;
        };
        const errorCode = errorResponse.error_code;
        const errorMsg = errorResponse.error_msg ?? 'Unknown error';
        this.logger.error(
          `OK API users.getInfo error: ${errorCode} - ${errorMsg}`,
        );
        throw new Error(`OK API users.getInfo error: ${errorMsg}`);
      }

      // users.getInfo возвращает массив объектов с информацией о пользователях
      if (Array.isArray(data)) {
        this.logger.log(`OK API users.getInfo returned ${data.length} users`);
        return data as OkUserInfo[];
      }

      // Если ответ не массив, но содержит данные пользователей
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
}
