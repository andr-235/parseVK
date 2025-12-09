import { Prisma } from '@prisma/client';
import { AUTHORS_CONSTANTS } from '../authors.constants';

interface ParsedCounters {
  photos: number | null;
  audios: number | null;
  videos: number | null;
  friends: number | null;
  followers: number | null;
}

export class AuthorCountersParser {
  extractCounters(value: unknown): ParsedCounters {
    if (!this.isValidObject(value)) {
      return this.getEmptyCounters();
    }

    const counters = value as Record<string, unknown>;

    return {
      photos: this.parseCounterValue(counters.photos ?? counters.photos_count),
      audios: this.parseCounterValue(counters.audios ?? counters.audio),
      videos: this.parseCounterValue(counters.videos ?? counters.video),
      friends: this.parseCounterValue(counters.friends),
      followers: this.parseCounterValue(
        counters.followers ?? counters.subscribers,
      ),
    };
  }

  parseCounterValue(value: unknown, depth = 0): number | null {
    if (this.isNullish(value)) {
      return null;
    }

    if (this.isFiniteNumber(value)) {
      return value;
    }

    if (this.isString(value)) {
      return this.parseStringValue(value);
    }

    if (depth >= AUTHORS_CONSTANTS.MAX_RECURSION_DEPTH) {
      return null;
    }

    if (Array.isArray(value)) {
      return this.parseArrayValue(value, depth);
    }

    if (this.isObject(value)) {
      return this.parseObjectValue(value, depth);
    }

    return null;
  }

  extractLastSeenAt(value: unknown): string | null {
    if (this.isNullish(value)) {
      return null;
    }

    if (this.isFiniteNumber(value)) {
      return this.toIsoDate(value);
    }

    if (this.isString(value)) {
      return this.parseStringDate(value);
    }

    if (this.isObject(value) && !Array.isArray(value)) {
      return this.parseObjectLastSeen(value as Record<string, unknown>);
    }

    return null;
  }

  private getEmptyCounters(): ParsedCounters {
    return {
      photos: null,
      audios: null,
      videos: null,
      friends: null,
      followers: null,
    };
  }

  private isValidObject(value: unknown): boolean {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  private isNullish(value: unknown): boolean {
    return value === null || value === undefined;
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private parseStringValue(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const numeric = Number.parseInt(trimmed, 10);
    return Number.isNaN(numeric) ? null : numeric;
  }

  private parseArrayValue(value: unknown[], depth: number): number | null {
    for (const item of value) {
      const resolved = this.parseCounterValue(item, depth + 1);
      if (resolved !== null) {
        return resolved;
      }
    }
    return null;
  }

  private parseObjectValue(
    value: Record<string, unknown>,
    depth: number,
  ): number | null {
    const preferredKeys = [
      'count',
      'value',
      'total',
      'amount',
      'items',
      'length',
      'quantity',
      'num',
    ];

    for (const key of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const resolved = this.parseCounterValue(value[key], depth + 1);
        if (resolved !== null) {
          return resolved;
        }
      }
    }

    for (const nestedValue of Object.values(value)) {
      const resolved = this.parseCounterValue(nestedValue, depth + 1);
      if (resolved !== null) {
        return resolved;
      }
    }

    return null;
  }

  private parseStringDate(value: string): string | null {
    const directDate = new Date(value);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate.toISOString();
    }

    const numeric = Number.parseInt(value, 10);
    if (!Number.isNaN(numeric)) {
      return this.toIsoDate(numeric);
    }

    return null;
  }

  private parseObjectLastSeen(data: Record<string, unknown>): string | null {
    const time = data.time;

    if (this.isFiniteNumber(time)) {
      return this.toIsoDate(time);
    }

    if (this.isString(time)) {
      const numeric = Number.parseInt(time, 10);
      if (!Number.isNaN(numeric)) {
        return this.toIsoDate(numeric);
      }
    }

    const dateValue = data.date;
    if (this.isString(dateValue)) {
      const date = new Date(dateValue);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return null;
  }

  private toIsoDate(timestamp: number): string | null {
    const multiplier =
      timestamp > AUTHORS_CONSTANTS.MILLISECONDS_THRESHOLD ? 1 : 1000;
    const date = new Date(timestamp * multiplier);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }
}
