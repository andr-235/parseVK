import { AUTHORS_CONSTANTS } from '../authors.constants.js';
import {
  isNullish,
  isFiniteNumber,
  isString,
  isObject,
} from './parser-utils.js';

export class CounterValueParser {
  parse(value: unknown, depth = 0): number | null {
    if (isNullish(value)) {
      return null;
    }

    if (isFiniteNumber(value)) {
      return value;
    }

    if (isString(value)) {
      return this.parseStringValue(value);
    }

    if (depth >= AUTHORS_CONSTANTS.MAX_RECURSION_DEPTH) {
      return null;
    }

    if (Array.isArray(value)) {
      return this.parseArrayValue(value, depth);
    }

    if (isObject(value)) {
      return this.parseObjectValue(value, depth);
    }

    return null;
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
      const resolved = this.parse(item, depth + 1);
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
        const resolved = this.parse(value[key], depth + 1);
        if (resolved !== null) {
          return resolved;
        }
      }
    }

    for (const nestedValue of Object.values(value)) {
      const resolved = this.parse(nestedValue, depth + 1);
      if (resolved !== null) {
        return resolved;
      }
    }

    return null;
  }
}
