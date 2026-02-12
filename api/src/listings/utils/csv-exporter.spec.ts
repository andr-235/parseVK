import { describe, it, expect } from 'vitest';
import type { ListingDto } from '../dto/listing.dto.js';
import {
  escapeCsv,
  formatCsvHeader,
  formatCsvRow,
  parseCsvFields,
  buildCsvFilename,
  CSV_DEFAULT_FIELDS,
  CSV_FIELD_LABELS,
} from './csv-exporter.js';

const makeListing = (overrides: Partial<ListingDto> = {}): ListingDto => ({
  id: 1,
  source: 'avito',
  externalId: 'ext-1',
  title: 'Квартира',
  description: 'Описание',
  url: 'https://example.com/1',
  price: 5000000,
  currency: 'RUB',
  address: 'Москва, ул. Пушкина',
  city: 'Москва',
  latitude: null,
  longitude: null,
  rooms: null,
  areaTotal: null,
  areaLiving: null,
  areaKitchen: null,
  floor: null,
  floorsTotal: null,
  publishedAt: '2024-01-01T00:00:00.000Z',
  contactName: null,
  contactPhone: null,
  images: ['https://img1.jpg', 'https://img2.jpg'],
  sourceAuthorName: 'Продавец',
  sourceAuthorPhone: '+79001234567',
  sourceAuthorUrl: 'https://avito.ru/user/123',
  sourcePostedAt: '2024-01-01T00:00:00.000Z',
  sourceParsedAt: '2024-01-02T00:00:00.000Z',
  manualOverrides: [],
  manualNote: null,
  archived: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('escapeCsv', () => {
  it('возвращает пустую строку для null', () => {
    expect(escapeCsv(null)).toBe('');
  });

  it('возвращает пустую строку для undefined', () => {
    expect(escapeCsv(undefined)).toBe('');
  });

  it('возвращает строку без кавычек если нет спецсимволов', () => {
    expect(escapeCsv('простой текст')).toBe('простой текст');
  });

  it('оборачивает в кавычки если есть запятая', () => {
    expect(escapeCsv('Москва, ул. Пушкина')).toBe('"Москва, ул. Пушкина"');
  });

  it('оборачивает в кавычки и экранирует внутренние кавычки', () => {
    expect(escapeCsv('текст "в кавычках"')).toBe('"текст ""в кавычках"""');
  });

  it('оборачивает в кавычки если есть перенос строки', () => {
    expect(escapeCsv('строка1\nстрока2')).toBe('"строка1\nстрока2"');
  });

  it('конвертирует число в строку', () => {
    expect(escapeCsv(42)).toBe('42');
  });

  it('конвертирует булево значение', () => {
    expect(escapeCsv(true)).toBe('true');
    expect(escapeCsv(false)).toBe('false');
  });

  it('объединяет массив через "; " и оборачивает в кавычки из-за символа ";"', () => {
    expect(escapeCsv(['a', 'b', 'c'])).toBe('"a; b; c"');
  });

  it('экранирует массив с запятыми', () => {
    expect(escapeCsv(['a,b', 'c'])).toBe('"a,b; c"');
  });
});

describe('formatCsvHeader', () => {
  it('возвращает заголовки через запятую', () => {
    const header = formatCsvHeader(['id', 'source', 'title']);
    expect(header).toBe('ID,Источник,Заголовок');
  });

  it('использует кастомные метки если переданы', () => {
    const labels = { id: 'Номер', source: 'Источник' } as Record<
      string,
      string
    >;
    const header = formatCsvHeader(
      ['id', 'source'],
      labels as typeof CSV_FIELD_LABELS,
    );
    expect(header).toBe('Номер,Источник');
  });

  it('использует ключ поля если метка не найдена', () => {
    const header = formatCsvHeader(['id'], {} as typeof CSV_FIELD_LABELS);
    expect(header).toBe('id');
  });
});

describe('formatCsvRow', () => {
  it('возвращает значения через запятую', () => {
    const listing = makeListing({ id: 42, source: 'avito', title: 'Квартира' });
    const row = formatCsvRow(listing, ['id', 'source', 'title']);
    expect(row).toBe('42,avito,Квартира');
  });

  it('экранирует значения с запятыми', () => {
    const listing = makeListing({ address: 'Москва, ул. Пушкина' });
    const row = formatCsvRow(listing, ['address']);
    expect(row).toBe('"Москва, ул. Пушкина"');
  });

  it('объединяет массив изображений через "; " (с кавычками из-за ";")', () => {
    const listing = makeListing({
      images: ['https://img1.jpg', 'https://img2.jpg'],
    });
    const row = formatCsvRow(listing, ['images']);
    expect(row).toBe('"https://img1.jpg; https://img2.jpg"');
  });

  it('использует publishedAt как fallback для дат', () => {
    const listing = makeListing({
      publishedAt: '2024-01-01',
      sourcePostedAt: null,
      sourceParsedAt: null,
    });
    const row = formatCsvRow(listing, ['publishedAt']);
    expect(row).toBe('2024-01-01');
  });

  it('возвращает пустую строку для null полей', () => {
    const listing = makeListing({ price: null, currency: null });
    const row = formatCsvRow(listing, ['price', 'currency']);
    expect(row).toBe(',');
  });

  it('обрабатывает все поля по умолчанию без ошибок', () => {
    const listing = makeListing();
    expect(() => formatCsvRow(listing, [...CSV_DEFAULT_FIELDS])).not.toThrow();
  });
});

describe('parseCsvFields', () => {
  it('возвращает все поля по умолчанию для пустой строки', () => {
    expect(parseCsvFields('')).toEqual([...CSV_DEFAULT_FIELDS]);
  });

  it('возвращает все поля по умолчанию для undefined', () => {
    expect(parseCsvFields(undefined)).toEqual([...CSV_DEFAULT_FIELDS]);
  });

  it('фильтрует только допустимые поля', () => {
    const result = parseCsvFields('id,source,unknown_field,title');
    expect(result).toEqual(['id', 'source', 'title']);
  });

  it('возвращает все поля по умолчанию если нет допустимых', () => {
    const result = parseCsvFields('invalid1,invalid2');
    expect(result).toEqual([...CSV_DEFAULT_FIELDS]);
  });

  it('обрезает пробелы вокруг полей', () => {
    const result = parseCsvFields(' id , source , title ');
    expect(result).toEqual(['id', 'source', 'title']);
  });
});

describe('buildCsvFilename', () => {
  it('включает "listings" в имя файла', () => {
    const name = buildCsvFilename({});
    expect(name).toMatch(/^listings_/);
    expect(name).toMatch(/\.csv$/);
  });

  it('включает источник если указан', () => {
    const name = buildCsvFilename({ source: 'avito' });
    expect(name).toContain('avito');
  });

  it('включает "all" если exportAll=true', () => {
    const name = buildCsvFilename({ exportAll: true });
    expect(name).toContain('_all_');
  });

  it('не включает "all" если exportAll не указан', () => {
    const name = buildCsvFilename({ source: 'avito' });
    expect(name).not.toContain('_all_');
  });

  it('содержит дату в формате YYYY-MM-DD-HH-mm', () => {
    const name = buildCsvFilename({});
    expect(name).toMatch(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/);
  });
});
