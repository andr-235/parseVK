import { Injectable, Logger } from '@nestjs/common';
import { OK_API_BASE_URL } from '../ok-friends.constants.js';
import {
  signOkRequest,
  type OkApiParams,
} from '../ok-friends-signature.util.js';
import { OkAuthService } from './ok-auth.service.js';

export interface OkFriendsGetParams {
  fid?: string;
  offset?: number;
  limit?: number;
}

export interface OkFriendsGetResponse {
  friends: string[];
}

/**
 * Сервис для получения списка друзей через OK API (friends.get).
 */
@Injectable()
export class OkFriendsGetService {
  private readonly logger = new Logger(OkFriendsGetService.name);

  constructor(private readonly auth: OkAuthService) {}

  async friendsGet(params: OkFriendsGetParams): Promise<OkFriendsGetResponse> {
    this.auth.assertCredentialsAvailable();

    const { accessToken, applicationKey, applicationSecretKey } =
      this.auth.getCredentials();

    const apiParams: OkApiParams = {
      application_key: applicationKey,
      method: 'friends.get',
      format: 'json',
    };

    if (params.fid !== undefined) apiParams.fid = params.fid;
    if (params.offset !== undefined) apiParams.offset = String(params.offset);
    if (params.limit !== undefined) apiParams.limit = String(params.limit);

    const sig = signOkRequest(apiParams, accessToken, applicationSecretKey);

    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(apiParams)) {
      if (value !== undefined) queryParams.append(key, String(value));
    }
    queryParams.append('sig', sig);
    if (accessToken) queryParams.append('session_key', accessToken);

    const url = `${OK_API_BASE_URL}/friends/get?${queryParams.toString()}`;
    const maskedUrl = url.replace(/access_token=[^&]+/, 'access_token=***');
    this.logger.log(`OK API request URL: ${maskedUrl}`);
    this.logger.log(
      `OK API params: application_key=${applicationKey}, method=${apiParams.method}, fid=${params.fid ?? 'undefined'}, offset=${params.offset ?? 'undefined'}, limit=${params.limit ?? 'undefined'}`,
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

      this.checkApiError(data);

      this.logger.log(`OK API response keys: ${Object.keys(data).join(', ')}`);

      const friendsArray = this.extractFriendsArray(data);
      if (!friendsArray) {
        this.logger.error(
          `OK API returned invalid friends array. Response structure: ${JSON.stringify(data).substring(0, 500)}`,
        );
        throw new Error('OK API returned invalid response format');
      }

      return {
        friends: friendsArray
          .map((id) => {
            if (typeof id === 'number') return String(id);
            if (typeof id === 'string') return id;
            if (typeof id === 'bigint') return id.toString();
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

  private checkApiError(data: object): void {
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

    if ('error_code' in data && data.error_code) {
      const errorResponse = data as {
        error_code: number;
        error_msg?: string;
      };
      const errorMsg = errorResponse.error_msg ?? 'Unknown error';
      this.logger.error(
        `OK API error: ${errorResponse.error_code} - ${errorMsg}`,
      );
      throw new Error(`OK API error: ${errorMsg}`);
    }
  }

  private extractFriendsArray(data: object): unknown[] | null {
    if ('friends' in data && Array.isArray(data.friends))
      return data.friends as unknown[];
    if ('uids' in data && Array.isArray(data.uids))
      return data.uids as unknown[];
    if (Array.isArray(data)) return data as unknown[];
    return null;
  }
}
