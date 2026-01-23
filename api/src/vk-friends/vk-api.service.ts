import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIError, VK, VKError } from 'vk-io';
import type { Objects, Responses } from 'vk-io';

export type VkFriendsGetParams = {
  user_id?: number;
  order?: 'hints' | 'mobile' | 'name' | 'random' | 'smart';
  list_id?: number;
  count?: number;
  offset?: number;
  fields?: Objects.UsersFields[];
  name_case?: 'nom' | 'gen' | 'dat' | 'acc' | 'ins' | 'abl';
  ref?: string;
};

@Injectable()
export class VkApiService {
  private readonly vk: VK;
  private readonly maxAttempts = 3;
  private readonly backoffBaseMs = 250;

  constructor() {
    const token = process.env.VK_TOKEN;
    if (!token) {
      throw new Error('VK_TOKEN environment variable is required');
    }

    const apiVersion = process.env.VK_API_VERSION?.trim() || '5.199';

    this.vk = new VK({
      token,
      apiVersion,
    });
  }

  async friendsGet(
    params: VkFriendsGetParams,
  ): Promise<Responses.FriendsGetResponse> {
    const { user_id, order, list_id, count, offset, fields, name_case, ref } =
      params;

    try {
      return await this.executeWithRetry(
        () =>
          this.vk.api.friends.get({
            user_id,
            order,
            list_id,
            count,
            offset,
            fields,
            name_case,
            ref,
          }),
        'friends.get',
      );
    } catch (error) {
      throw this.toHttpException(error, 'friends.get');
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    method: string,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (!this.isNetworkError(error) || attempt >= this.maxAttempts) {
          throw error;
        }

        const delay = this.backoffBaseMs * Math.pow(attempt, 2);
        await this.sleep(delay);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Unknown VK API error in ${method}`);
  }

  private toHttpException(error: unknown, method: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    if (error instanceof APIError) {
      const code =
        typeof error.code === 'number' || typeof error.code === 'string'
          ? ` (code ${error.code})`
          : '';
      return new HttpException(
        `VK API error${code} while calling ${method}: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (error instanceof VKError) {
      return new HttpException(
        `VK API error while calling ${method}: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (this.isNetworkError(error)) {
      return new HttpException(
        `Network error while calling VK API (${method}): ${this.describeError(error)}`,
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    if (error instanceof Error) {
      return new HttpException(
        `Failed to call VK API (${method}): ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    return new HttpException(
      `Failed to call VK API (${method})`,
      HttpStatus.BAD_GATEWAY,
    );
  }

  private isNetworkError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    if (error instanceof APIError) {
      return false;
    }

    if (error instanceof VKError && error.cause) {
      return this.isNetworkError(error.cause);
    }

    if (error instanceof Error) {
      const err = error as Error & {
        code?: string;
        cause?: { code?: string };
      };
      const code = err.code ?? err.cause?.code;
      const message = err.message.toLowerCase();

      if (
        code === 'ETIMEDOUT' ||
        code === 'ECONNABORTED' ||
        code === 'ESOCKETTIMEDOUT' ||
        code === 'ECONNRESET' ||
        code === 'EAI_AGAIN' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNREFUSED'
      ) {
        return true;
      }

      if (
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('enotfound') ||
        message.includes('eai_again') ||
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('fetch')
      ) {
        return true;
      }
    }

    return false;
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      const code = (error as Error & { code?: string }).code;
      return code ? `${error.message} (code: ${code})` : error.message;
    }

    return String(error);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
