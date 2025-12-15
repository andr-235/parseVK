export class ParserUtils {
  static isNullish(value: unknown): boolean {
    return value === null || value === undefined;
  }

  static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  static isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  static isValidObject(value: unknown): boolean {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }
}
