import { describe, it, expect, beforeEach } from 'vitest';
import { ListingNormalizerService } from './listing-normalizer.service.js';
import type { ListingImportDto } from '../dto/listing-import.dto.js';

const makeImportDto = (
  overrides: Partial<ListingImportDto> = {},
): ListingImportDto => ({
  url: 'https://example.com/item/1',
  ...overrides,
});

describe('ListingNormalizerService', () => {
  let service: ListingNormalizerService;

  beforeEach(() => {
    service = new ListingNormalizerService();
  });

  describe('buildListingData', () => {
    it('возвращает объект с url', () => {
      const result = service.buildListingData(makeImportDto());
      expect(result.url).toBe('https://example.com/item/1');
    });

    it('нормализует строковые поля (trim, null для пустых)', () => {
      const result = service.buildListingData(
        makeImportDto({ title: '  Квартира  ', source: '' }),
      );
      expect(result.title).toBe('Квартира');
      expect(result.source).toBeUndefined();
    });

    it('нормализует целочисленное поле price', () => {
      const result = service.buildListingData(
        makeImportDto({ price: '5 000 000 руб' }),
      );
      expect(result.price).toBe(5000000);
    });

    it('возвращает undefined для невалидного числа', () => {
      const result = service.buildListingData(makeImportDto({ price: 'abc' }));
      expect(result.price).toBeUndefined();
    });

    it('нормализует float поле latitude', () => {
      const result = service.buildListingData(
        makeImportDto({ latitude: '55,7558' }),
      );
      expect(result.latitude).toBe(55.7558);
    });

    it('нормализует дату publishedAt', () => {
      const result = service.buildListingData(
        makeImportDto({ publishedAt: '2024-01-15T10:00:00.000Z' }),
      );
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('возвращает undefined для невалидной даты', () => {
      const result = service.buildListingData(
        makeImportDto({ publishedAt: 'not-a-date' }),
      );
      expect(result.publishedAt).toBeUndefined();
    });

    it('фильтрует пустые элементы массива images', () => {
      const result = service.buildListingData(
        makeImportDto({
          images: ['https://img1.jpg', '', '  ', 'https://img2.jpg'],
        }),
      );
      expect(result.images).toEqual(['https://img1.jpg', 'https://img2.jpg']);
    });

    it('извлекает sourceAuthorName из metadata если не задан напрямую', () => {
      const result = service.buildListingData(
        makeImportDto({
          metadata: { author: 'Иван Иванов' },
        }),
      );
      expect(result.sourceAuthorName).toBe('Иван Иванов');
    });

    it('прямое поле имеет приоритет над metadata', () => {
      const result = service.buildListingData(
        makeImportDto({
          sourceAuthorName: 'Прямое имя',
          metadata: { author: 'Из метаданных' },
        }),
      );
      expect(result.sourceAuthorName).toBe('Прямое имя');
    });
  });

  describe('excludeManualOverrides', () => {
    it('исключает поля из manualOverrides', () => {
      const data = {
        url: 'https://example.com',
        price: 5000,
        title: 'Квартира',
      };
      const result = service.excludeManualOverrides(data as never, ['price']);
      expect(result.price).toBeUndefined();
      expect(result.title).toBe('Квартира');
    });

    it('всегда удаляет manualOverrides из результата', () => {
      const data = {
        url: 'https://example.com',
        manualOverrides: ['price'],
      };
      const result = service.excludeManualOverrides(data as never, []);
      expect(
        (result as { manualOverrides?: unknown }).manualOverrides,
      ).toBeUndefined();
    });

    it('возвращает полный объект если overrides пустой', () => {
      const data = { url: 'https://example.com', price: 5000 };
      const result = service.excludeManualOverrides(data as never, []);
      expect(result.price).toBe(5000);
    });
  });

  describe('normalizeManualOverrides', () => {
    it('возвращает пустой массив для не-массива', () => {
      expect(service.normalizeManualOverrides(null)).toEqual([]);
      expect(service.normalizeManualOverrides('price')).toEqual([]);
      expect(service.normalizeManualOverrides(undefined)).toEqual([]);
    });

    it('фильтрует пустые строки', () => {
      expect(
        service.normalizeManualOverrides(['price', '', '  ', 'title']),
      ).toEqual(['price', 'title']);
    });

    it('обрезает пробелы в строках', () => {
      expect(service.normalizeManualOverrides(['  price  '])).toEqual([
        'price',
      ]);
    });

    it('фильтрует не-строки', () => {
      expect(service.normalizeManualOverrides(['price', 42, null])).toEqual([
        'price',
      ]);
    });
  });
});
