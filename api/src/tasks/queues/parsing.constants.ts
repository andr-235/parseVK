/**
 * Константы для очереди парсинга
 */

export const PARSING_QUEUE = 'parsing';

/**
 * Настройки concurrency для BullMQ
 *
 * ВАЖНО: VK API имеет rate limits:
 * - Без токена: 3 req/sec
 * - С токеном: 20 req/sec (зависит от типа токена)
 *
 * vk-io уже управляет rate limiting, поэтому:
 * - concurrency должен быть низким (2-3)
 * - это позволит обрабатывать несколько задач параллельно
 * - но не перегружать VK API
 */
export const PARSING_CONCURRENCY = 2; // Одновременно 2 задачи

/**
 * Rate limiter на уровне BullMQ (дополнительная защита)
 * Ограничиваем количество задач, которые могут стартовать за период
 */
export const PARSING_RATE_LIMITER = {
  max: 3, // Максимум 3 задачи
  duration: 5000, // За 5 секунд
};

/**
 * Настройки retry для failed задач
 */
export const PARSING_RETRY_OPTIONS = {
  attempts: 3, // Максимум 3 попытки
  backoff: {
    type: 'exponential' as const,
    delay: 5000, // Начальная задержка 5 секунд
  },
};

/**
 * Timeout для обработки одной задачи
 */
export const PARSING_JOB_TIMEOUT = 30 * 60 * 1000; // 30 минут
