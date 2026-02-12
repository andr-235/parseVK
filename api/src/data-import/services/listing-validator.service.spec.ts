import { describe, it, expect, beforeEach } from 'vitest';
import { ListingValidatorService } from './listing-validator.service.js';

describe('ListingValidatorService', () => {
  let service: ListingValidatorService;

  beforeEach(() => {
    service = new ListingValidatorService();
  });

  describe('normalizeUrl', () => {
    it('нормализует простой URL', () => {
      expect(service.normalizeUrl('https://example.com/item/123')).toBe(
        'https://example.com/item/123',
      );
    });

    it('удаляет фрагмент (#hash)', () => {
      expect(service.normalizeUrl('https://example.com/item#section')).toBe(
        'https://example.com/item',
      );
    });

    it('удаляет query-параметры', () => {
      expect(
        service.normalizeUrl('https://example.com/item?ref=main&utm=test'),
      ).toBe('https://example.com/item');
    });

    it('приводит hostname к нижнему регистру', () => {
      expect(service.normalizeUrl('https://EXAMPLE.COM/item')).toBe(
        'https://example.com/item',
      );
    });

    it('убирает двойные слэши в пути', () => {
      expect(service.normalizeUrl('https://example.com//item//123')).toBe(
        'https://example.com/item/123',
      );
    });

    it('убирает завершающий слэш (кроме корня)', () => {
      expect(service.normalizeUrl('https://example.com/item/')).toBe(
        'https://example.com/item',
      );
    });

    it('сохраняет "/" для корневого URL', () => {
      expect(service.normalizeUrl('https://example.com/')).toBe(
        'https://example.com/',
      );
    });

    it('обрезает пробелы', () => {
      expect(service.normalizeUrl('  https://example.com/item  ')).toBe(
        'https://example.com/item',
      );
    });

    it('выбрасывает ошибку для пустого URL', () => {
      expect(() => service.normalizeUrl('')).toThrow();
    });

    it('выбрасывает ошибку для невалидного URL', () => {
      expect(() => service.normalizeUrl('not-a-url')).toThrow();
    });
  });

  describe('isUniqueViolation', () => {
    it('возвращает true для ошибки P2002', () => {
      expect(service.isUniqueViolation({ code: 'P2002' })).toBe(true);
    });

    it('возвращает false для другого кода ошибки', () => {
      expect(service.isUniqueViolation({ code: 'P2003' })).toBe(false);
    });

    it('возвращает false для обычной ошибки', () => {
      expect(service.isUniqueViolation(new Error('test'))).toBe(false);
    });

    it('возвращает false для null', () => {
      expect(service.isUniqueViolation(null)).toBe(false);
    });

    it('возвращает false для undefined', () => {
      expect(service.isUniqueViolation(undefined)).toBe(false);
    });
  });

  describe('mapPrismaError', () => {
    it('форматирует код ошибки Prisma', () => {
      expect(service.mapPrismaError({ code: 'P2002' })).toBe(
        'Prisma error P2002',
      );
    });

    it('возвращает message для Error', () => {
      expect(service.mapPrismaError(new Error('test message'))).toBe(
        'test message',
      );
    });

    it('возвращает дефолтное сообщение для неизвестных ошибок', () => {
      expect(service.mapPrismaError('unknown')).toBe(
        'Неизвестная ошибка базы данных',
      );
    });

    it('возвращает дефолтное сообщение для null', () => {
      expect(service.mapPrismaError(null)).toBe(
        'Неизвестная ошибка базы данных',
      );
    });
  });
});
