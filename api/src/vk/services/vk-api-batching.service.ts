import { Injectable, Logger } from '@nestjs/common';

export interface BatchRequest<T> {
  id: string;
  data: T;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

export interface BatchOptions {
  maxBatchSize?: number;
  maxWaitMs?: number;
}

/**
 * Сервис для батчинга запросов к VK API
 *
 * Группирует несколько запросов одного типа в один batch для оптимизации.
 * Особенно полезно для getAuthors, где можно запросить до 1000 пользователей за раз.
 */
@Injectable()
export class VkApiBatchingService {
  private readonly logger = new Logger(VkApiBatchingService.name);
  private readonly defaultMaxBatchSize = 1000; // VK API лимит для users.get
  private readonly defaultMaxWaitMs = 50; // Максимальное время ожидания для формирования batch

  /**
   * Создает батч из запросов
   * @param requests Запросы для батчинга
   * @param batchFn Функция для выполнения батча
   * @param options Опции батчинга
   * @returns Массив результатов в том же порядке, что и запросы
   */
  async batch<TInput, TOutput>(
    requests: TInput[],
    batchFn: (batch: TInput[]) => Promise<TOutput[]>,
    options: BatchOptions = {},
  ): Promise<TOutput[]> {
    if (requests.length === 0) {
      return [];
    }

    const maxBatchSize = options.maxBatchSize ?? this.defaultMaxBatchSize;
    const results: TOutput[] = [];

    // Разбиваем на батчи
    for (let i = 0; i < requests.length; i += maxBatchSize) {
      const batch = requests.slice(i, i + maxBatchSize);
      const batchResults = await batchFn(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Создает батч с маппингом результатов по ключам
   * @param requests Запросы с ключами
   * @param batchFn Функция для выполнения батча
   * @param mapFn Функция для маппинга результатов к ключам
   * @param options Опции батчинга
   * @returns Map с результатами по ключам
   */
  async batchWithMapping<TInput, TOutput, TKey>(
    requests: Array<{ key: TKey; data: TInput }>,
    batchFn: (batch: TInput[]) => Promise<TOutput[]>,
    mapFn: (input: TInput, output: TOutput) => TKey,
    options: BatchOptions = {},
  ): Promise<Map<TKey, TOutput>> {
    if (requests.length === 0) {
      return new Map();
    }

    const maxBatchSize = options.maxBatchSize ?? this.defaultMaxBatchSize;
    const resultMap = new Map<TKey, TOutput>();

    // Разбиваем на батчи
    for (let i = 0; i < requests.length; i += maxBatchSize) {
      const batch = requests.slice(i, i + maxBatchSize);
      const batchData = batch.map((r) => r.data);
      const batchResults = await batchFn(batchData);

      // Маппим результаты к ключам
      for (let j = 0; j < batch.length; j++) {
        const key = mapFn(batch[j].data, batchResults[j]);
        resultMap.set(key, batchResults[j]);
      }
    }

    return resultMap;
  }

  /**
   * Создает очередь батчей с автоматическим выполнением
   * @param batchFn Функция для выполнения батча
   * @param options Опции батчинга
   * @returns Функция для добавления запросов в очередь
   */
  createBatchQueue<TInput, TOutput>(
    batchFn: (batch: TInput[]) => Promise<TOutput[]>,
    options: BatchOptions = {},
  ): (request: TInput) => Promise<TOutput> {
    const maxBatchSize = options.maxBatchSize ?? this.defaultMaxBatchSize;
    const maxWaitMs = options.maxWaitMs ?? this.defaultMaxWaitMs;

    const queue: BatchRequest<TInput>[] = [];
    let timeout: NodeJS.Timeout | null = null;

    const processBatch = async () => {
      if (queue.length === 0) {
        return;
      }

      const currentBatch = queue.splice(0, maxBatchSize);
      const batchData = currentBatch.map((r) => r.data);

      try {
        const results = await batchFn(batchData);

        // Разрешаем промисы с результатами
        for (let i = 0; i < currentBatch.length; i++) {
          currentBatch[i].resolve(results[i]);
        }
      } catch (error) {
        // Отклоняем все промисы с ошибкой
        const err = error instanceof Error ? error : new Error(String(error));
        for (const request of currentBatch) {
          request.reject(err);
        }
      }

      // Если есть еще запросы в очереди, планируем следующий батч
      if (queue.length > 0) {
        scheduleNextBatch();
      }
    };

    const scheduleNextBatch = () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      // Если очередь заполнена, выполняем сразу
      if (queue.length >= maxBatchSize) {
        void processBatch();
      } else {
        // Иначе ждем до maxWaitMs
        timeout = setTimeout(() => {
          void processBatch();
        }, maxWaitMs);
      }
    };

    return (request: TInput): Promise<TOutput> => {
      return new Promise((resolve, reject) => {
        queue.push({
          id: `${Date.now()}-${Math.random()}`,
          data: request,
          resolve: resolve as (value: unknown) => void,
          reject,
        });

        scheduleNextBatch();
      });
    };
  }
}
