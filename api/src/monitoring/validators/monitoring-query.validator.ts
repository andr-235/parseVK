import { Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../monitoring.constants.js';

@Injectable()
export class MonitoringQueryValidator {
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

  parseFromDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  parseSources(sources?: string | string[]): string[] | undefined {
    if (!sources) {
      return undefined;
    }

    const values = Array.isArray(sources) ? sources : sources.split(',');
    const normalized = values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (normalized.length === 0) {
      return undefined;
    }

    return Array.from(new Set(normalized));
  }

  normalizeLimit(limit: number): number {
    return Math.min(Math.max(limit, 1), MAX_LIMIT);
  }

  normalizePage(page: number): number {
    if (!Number.isFinite(page)) {
      return 1;
    }

    return Math.max(page, 1);
  }

  normalizeLimitWithDefault(limit?: number): number {
    return this.normalizeLimit(limit ?? DEFAULT_LIMIT);
  }
}
