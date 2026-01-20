import { Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../monitoring.constants';

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
