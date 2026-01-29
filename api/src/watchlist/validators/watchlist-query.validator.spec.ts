import { WatchlistQueryValidator } from './watchlist-query.validator.js';

describe('WatchlistQueryValidator', () => {
  let validator: WatchlistQueryValidator;

  beforeEach(() => {
    validator = new WatchlistQueryValidator();
  });

  describe('normalizeOffset', () => {
    it('должен возвращать 0 для undefined', () => {
      expect(validator.normalizeOffset(undefined)).toBe(0);
    });

    it('должен возвращать 0 для отрицательных значений', () => {
      expect(validator.normalizeOffset(-5)).toBe(0);
    });

    it('должен возвращать значение для положительных', () => {
      expect(validator.normalizeOffset(10)).toBe(10);
    });
  });

  describe('normalizeLimit', () => {
    it('должен возвращать дефолтное значение для undefined', () => {
      expect(validator.normalizeLimit(undefined)).toBeGreaterThan(0);
    });

    it('должен ограничивать максимум 200', () => {
      expect(validator.normalizeLimit(500)).toBe(200);
    });

    it('должен возвращать минимум 1', () => {
      expect(validator.normalizeLimit(0)).toBe(1);
    });
  });

  describe('normalizeExcludeStopped', () => {
    it('должен возвращать true по умолчанию', () => {
      expect(validator.normalizeExcludeStopped(undefined)).toBe(true);
    });

    it('должен возвращать false только для явного false', () => {
      expect(validator.normalizeExcludeStopped(false)).toBe(false);
      expect(validator.normalizeExcludeStopped(true)).toBe(true);
    });
  });
});
