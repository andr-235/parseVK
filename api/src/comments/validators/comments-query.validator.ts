import { Injectable } from '@nestjs/common';

import { DEFAULT_LIMIT, MAX_LIMIT } from '../constants/comments.constants.js';
import type {
  KeywordSourceFilter,
  ReadStatusFilter,
} from '../types/comments-filters.type.js';

@Injectable()
export class CommentsQueryValidator {
  /**
   * Парсит и нормализует ключевые слова из query параметров
   *
   * Поддерживает строку (разделенную запятыми) или массив строк.
   * Удаляет пробелы, пустые значения и дубликаты.
   *
   * @param keywords - Ключевые слова в виде строки или массива
   * @returns Массив уникальных нормализованных ключевых слов или undefined
   */
  parseKeywords(keywords?: string | string[]): string[] | undefined {
    if (!keywords) {
      return undefined;
    }

    const values = Array.isArray(keywords) ? keywords : keywords.split(',');

    const normalized = values
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      // Если регистр важен — удали следующую строку
      .map((value) => value.toLowerCase());

    if (normalized.length === 0) {
      return undefined;
    }

    return Array.from(new Set(normalized));
  }

  /**
   * Нормализует статус прочтения из query параметра
   *
   * @param value - Значение из query параметра
   * @returns Нормализованный статус: 'all', 'read', 'unread' (по умолчанию 'all')
   */
  normalizeReadStatus(value?: string): ReadStatusFilter {
    if (!value) {
      return 'all';
    }

    const normalized = value.toLowerCase();
    if (normalized === 'read' || normalized === 'unread') {
      return normalized;
    }

    return 'all';
  }

  /**
   * Нормализует поисковый запрос, убирая пробелы
   *
   * @param search - Поисковый запрос из query параметра
   * @returns Обрезанная строка или undefined если пусто
   */
  normalizeSearch(search?: string): string | undefined {
    return search?.trim() || undefined;
  }

  /**
   * Нормализует offset, гарантируя неотрицательное значение
   *
   * @param offset - Значение offset из query параметра
   * @returns Нормализованный offset (минимум 0)
   */
  normalizeOffset(offset: number): number {
    return Math.max(offset, 0);
  }

  /**
   * Нормализует limit, ограничивая его допустимыми значениями
   *
   * @param limit - Значение limit из query параметра
   * @returns Нормализованный limit (от 1 до MAX_LIMIT)
   */
  normalizeLimit(limit: number): number {
    return Math.min(Math.max(limit, 1), MAX_LIMIT);
  }

  /**
   * Нормализует limit с использованием значения по умолчанию
   *
   * @param limit - Значение limit из query параметра (опционально)
   * @returns Нормализованный limit с дефолтным значением DEFAULT_LIMIT если не указан
   */
  normalizeLimitWithDefault(limit?: number): number {
    return this.normalizeLimit(limit ?? DEFAULT_LIMIT);
  }

  /**
   * Нормализует источник ключевых слов из query параметра
   *
   * @param value - Значение из query параметра ('COMMENT' или 'POST')
   * @returns Нормализованный источник или undefined если значение невалидно
   */
  normalizeKeywordSource(value?: string): KeywordSourceFilter | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.toUpperCase();
    if (normalized === 'COMMENT' || normalized === 'POST') {
      return normalized;
    }

    return undefined;
  }
}
