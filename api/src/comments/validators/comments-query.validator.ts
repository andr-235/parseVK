import { Injectable } from '@nestjs/common';
import type { ReadStatusFilter } from '../types/comments-filters.type';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

@Injectable()
export class CommentsQueryValidator {
  parseKeywords(keywords?: string | string[]): string[] | undefined {
    if (!keywords) {
      return undefined;
    }

    const values = Array.isArray(keywords) ? keywords : keywords.split(',');

    const normalized = values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (normalized.length === 0) {
      return undefined;
    }

    return Array.from(new Set(normalized));
  }

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

  normalizeSearch(search?: string): string | undefined {
    const trimmed = search?.trim();
    return trimmed ? trimmed : undefined;
  }

  normalizeOffset(offset: number): number {
    return Math.max(offset, 0);
  }

  normalizeLimit(limit: number): number {
    return Math.min(Math.max(limit, 1), MAX_LIMIT);
  }

  normalizeLimitWithDefault(limit?: number): number {
    return this.normalizeLimit(limit ?? DEFAULT_LIMIT);
  }
}

