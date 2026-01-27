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

/**
 * Сервис для работы с OK API
 *
 * Требуемые переменные окружения:
 * - OK_ACCESS_TOKEN - вечный access_token из настроек приложения OK.ru
 *   (получить в разделе "Access token" настроек приложения)
 * - OK_APPLICATION_KEY - публичный ключ приложения (application_key)
 *   (находится в основных настройках приложения)
 * - OK_APPLICATION_SECRET_KEY - секретный ключ приложения (application_secret_key)
 *   (находится в основных настройках приложения)
 *
 * Важно:
 * - session_secret_key вычисляется автоматически как MD5(access_token + application_secret_key).toLowerCase()
 * - access_token не включается в параметры для подписи запроса
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

    if (
      !this.accessToken ||
      !this.applicationKey ||
      !this.applicationSecretKey
    ) {
      this.logger.warn(
        'OK API credentials not configured. Set OK_ACCESS_TOKEN, OK_APPLICATION_KEY, OK_APPLICATION_SECRET_KEY',
      );
    }
  }

  async friendsGet(params: OkFriendsGetParams): Promise<OkFriendsGetResponse> {
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
    // access_token добавляется отдельно, после вычисления подписи
    queryParams.append('access_token', this.accessToken);

    const url = `${OK_API_BASE_URL}/friends/get?${queryParams.toString()}`;

    // Детальное логирование для отладки (без секретных данных)
    this.logger.debug(
      `OK API request: ${url.replace(/access_token=[^&]+/, 'access_token=***')}`,
    );
    this.logger.debug(
      `OK API params: application_key=${this.applicationKey}, method=${apiParams.method}, format=${apiParams.format}, fid=${params.fid ?? 'undefined'}, offset=${params.offset ?? 'undefined'}, limit=${params.limit ?? 'undefined'}`,
    );
    this.logger.debug(
      `OK API credentials check: accessToken=${this.accessToken ? 'set' : 'NOT SET'}, applicationKey=${this.applicationKey ? 'set' : 'NOT SET'}, applicationSecretKey=${this.applicationSecretKey ? 'set' : 'NOT SET'}`,
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
      this.logger.debug(
        `OK API response keys: ${Object.keys(data).join(', ')}`,
      );
      this.logger.debug(
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
}
