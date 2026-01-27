import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/app.config';
import { OK_API_BASE_URL } from './ok-friends.constants';
import { signOkRequest, type OkApiParams } from './ok-friends-signature.util';

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
    // Если fields не указан, передаем пустую строку для получения всех полей
    if (params.fields && params.fields.length > 0) {
      apiParams.fields = params.fields.join(',');
    } else {
      // Передаем пустую строку для получения всех доступных полей
      apiParams.fields = '';
    }

    if (params.emptyPictures !== undefined) {
      apiParams.emptyPictures = params.emptyPictures ? 'true' : 'false';
    }

    // Вычисляем подпись
    // Логируем параметры для подписи для отладки
    this.logger.log(
      `OK API users.getInfo params for signature: ${JSON.stringify(apiParams)}`,
    );
    const sig = signOkRequest(
      apiParams,
      this.accessToken,
      this.applicationSecretKey,
    );
    this.logger.log(`OK API users.getInfo sig: ${sig.substring(0, 8)}...`);

    // Формируем query параметры для запроса
    // Важно: URLSearchParams может не добавить параметр с пустой строкой
    // Поэтому для fields с пустой строкой явно добавляем параметр
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(apiParams)) {
      if (value !== undefined) {
        // Для fields с пустой строкой явно добавляем параметр
        if (key === 'fields' && value === '') {
          queryParams.append(key, '');
        } else {
          queryParams.append(key, String(value));
        }
      }
    }
    queryParams.append('sig', sig);
    if (this.accessToken) {
      queryParams.append('session_key', this.accessToken);
    }

    const url = `${OK_API_BASE_URL}/users/getInfo?${queryParams.toString()}`;

    // Детальное логирование для отладки
    const maskedUrl = url.replace(/session_key=[^&]+/, 'session_key=***');
    this.logger.log(`OK API users.getInfo request URL: ${maskedUrl}`);
    this.logger.log(
      `OK API users.getInfo params: application_key=${this.applicationKey}, method=users.getInfo, format=json, uids count=${params.uids.length}, fields=${apiParams.fields || 'NOT SET'}, fields type=${typeof apiParams.fields}, fields value=${JSON.stringify(apiParams.fields)}`,
    );
    this.logger.log(
      `OK API users.getInfo queryParams has fields: ${queryParams.has('fields')}, fields value in queryParams: ${queryParams.get('fields')}`,
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
