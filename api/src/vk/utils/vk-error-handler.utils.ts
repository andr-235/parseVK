import { APIError } from 'vk-io';

/**
 * Утилиты для обработки ошибок VK API
 */

/**
 * Типы ошибок VK API
 */
export enum VkErrorCode {
  ACCESS_DENIED = 15,
  TOO_MANY_REQUESTS = 6,
  INVALID_TOKEN = 5,
  PERMISSION_DENIED = 7,
}

/**
 * Проверяет, является ли ошибка ошибкой доступа (disabled wall)
 */
export function isAccessDeniedError(error: unknown): boolean {
  return error instanceof APIError && error.code === VkErrorCode.ACCESS_DENIED;
}

/**
 * Проверяет, является ли ошибка ошибкой слишком частых запросов
 */
export function isTooManyRequestsError(error: unknown): boolean {
  return (
    error instanceof APIError && error.code === VkErrorCode.TOO_MANY_REQUESTS
  );
}

/**
 * Проверяет, является ли ошибка ошибкой токена
 */
export function isInvalidTokenError(error: unknown): boolean {
  return error instanceof APIError && error.code === VkErrorCode.INVALID_TOKEN;
}

/**
 * Создает стандартный ответ для ошибок доступа
 */
export function createAccessDeniedResponse() {
  return {
    count: 0,
    current_level_count: 0,
    can_post: 0,
    show_reply_button: 0,
    groups_can_post: 0,
    items: [],
    profiles: [],
    groups: [],
  };
}

/**
 * Обрабатывает ошибку VK API с логированием
 */
export function handleVkApiError(
  error: unknown,
  context: string,
  logger: {
    error: (message: string, meta?: any) => void;
    warn: (message: string) => void;
  },
): never {
  if (error instanceof APIError) {
    logger.error(
      `VK API error in ${context}: ${error.message} (code: ${error.code})`,
      {
        code: error.code,
        message: error.message,
        context,
      },
    );

    if (error.code === VkErrorCode.ACCESS_DENIED) {
      logger.warn(`Access denied in ${context}, returning empty result`);
    }
  } else {
    logger.error(
      `Unknown error in ${context}`,
      error instanceof Error ? error.stack : String(error),
    );
  }

  throw error;
}

/**
 * Безопасно выполняет VK API запрос с обработкой ошибок
 */
export async function safeVkApiCall<T>(
  apiCall: () => Promise<T>,
  context: string,
  logger: {
    error: (message: string, meta?: any) => void;
    warn: (message: string) => void;
  },
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    if (isAccessDeniedError(error)) {
      logger.warn(`Access denied in ${context}, returning null`);
      return null;
    }

    handleVkApiError(error, context, logger);
    return null; // unreachable, but TypeScript needs it
  }
}
