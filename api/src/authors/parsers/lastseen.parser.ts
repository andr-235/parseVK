import { AUTHORS_CONSTANTS } from '../authors.constants.js';
import {
  isNullish,
  isFiniteNumber,
  isString,
  isObject,
} from './parser-utils.js';

export class LastSeenParser {
  extract(value: unknown): string | null {
    if (isNullish(value)) {
      return null;
    }

    if (isFiniteNumber(value)) {
      return this.toIsoDate(value);
    }

    if (isString(value)) {
      return this.parseStringDate(value);
    }

    if (isObject(value) && !Array.isArray(value)) {
      return this.parseObjectLastSeen(value);
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

    if (isFiniteNumber(time)) {
      return this.toIsoDate(time);
    }

    if (isString(time)) {
      const numeric = Number.parseInt(time, 10);
      if (!Number.isNaN(numeric)) {
        return this.toIsoDate(numeric);
      }
    }

    const dateValue = data.date;
    if (isString(dateValue)) {
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
