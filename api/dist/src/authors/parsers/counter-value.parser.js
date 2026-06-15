import { AUTHORS_CONSTANTS } from '../authors.constants.js';
import { isNullish, isFiniteNumber, isString, isObject, } from './parser-utils.js';
export class CounterValueParser {
    parse(value, depth = 0) {
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
    parseStringValue(value) {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return null;
        }
        const numeric = Number.parseInt(trimmed, 10);
        return Number.isNaN(numeric) ? null : numeric;
    }
    parseArrayValue(value, depth) {
        for (const item of value) {
            const resolved = this.parse(item, depth + 1);
            if (resolved !== null) {
                return resolved;
            }
        }
        return null;
    }
    parseObjectValue(value, depth) {
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
//# sourceMappingURL=counter-value.parser.js.map