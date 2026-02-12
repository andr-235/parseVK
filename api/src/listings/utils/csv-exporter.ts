import type { ListingDto } from '../dto/listing.dto.js';

export const CSV_DEFAULT_FIELDS = [
  'id',
  'source',
  'title',
  'url',
  'price',
  'currency',
  'address',
  'sourceAuthorName',
  'sourceAuthorPhone',
  'sourceAuthorUrl',
  'publishedAt',
  'postedAt',
  'parsedAt',
  'images',
  'description',
  'manualNote',
] as const;

export type CsvFieldKey = (typeof CSV_DEFAULT_FIELDS)[number];

export const CSV_FIELD_LABELS: Record<CsvFieldKey, string> = {
  id: 'ID',
  source: 'Источник',
  title: 'Заголовок',
  url: 'Ссылка',
  price: 'Цена',
  currency: 'Валюта',
  address: 'Адрес',
  sourceAuthorName: 'Имя продавца',
  sourceAuthorPhone: 'Телефон продавца',
  sourceAuthorUrl: 'Ссылка на продавца',
  publishedAt: 'Дата публикации',
  postedAt: 'Оригинальная дата публикации',
  parsedAt: 'Дата парсинга',
  images: 'Изображения',
  description: 'Описание',
  manualNote: 'Примечание',
};

export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return escapeCsv(value.join('; '));
  }
  const str =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : JSON.stringify(value);
  const needsQuotes = /[",\n\r;]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function formatCsvHeader(
  fields: CsvFieldKey[],
  labels: Record<CsvFieldKey, string> = CSV_FIELD_LABELS,
): string {
  return fields.map((field) => escapeCsv(labels[field] ?? field)).join(',');
}

export function formatCsvRow(item: ListingDto, fields: CsvFieldKey[]): string {
  return fields
    .map((key) => {
      const value = pickFieldValue(item, key);
      return escapeCsv(value);
    })
    .join(',');
}

function pickFieldValue(item: ListingDto, key: CsvFieldKey): unknown {
  switch (key) {
    case 'id':
      return item.id;
    case 'source':
      return item.source;
    case 'title':
      return item.title;
    case 'url':
      return item.url;
    case 'price':
      return item.price;
    case 'currency':
      return item.currency;
    case 'address':
      return item.address;
    case 'publishedAt':
      return (
        item.publishedAt ?? item.sourcePostedAt ?? item.sourceParsedAt ?? ''
      );
    case 'postedAt':
      return item.sourcePostedAt ?? '';
    case 'parsedAt':
      return item.sourceParsedAt ?? '';
    case 'images':
      return item.images;
    case 'description':
      return item.description;
    case 'sourceAuthorName':
      return item.sourceAuthorName;
    case 'sourceAuthorPhone':
      return item.sourceAuthorPhone;
    case 'sourceAuthorUrl':
      return item.sourceAuthorUrl;
    case 'manualNote':
      return item.manualNote;
    default:
      return '';
  }
}

export function parseCsvFields(value?: string): CsvFieldKey[] {
  const raw = (value ?? '').trim();
  if (!raw) return [...CSV_DEFAULT_FIELDS];
  const allowed = new Set<string>(CSV_DEFAULT_FIELDS);
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const result: CsvFieldKey[] = [];
  for (const key of list) {
    if (allowed.has(key)) {
      result.push(key as CsvFieldKey);
    }
  }
  return result.length > 0 ? result : [...CSV_DEFAULT_FIELDS];
}

export function buildCsvFilename(options: {
  source?: string;
  exportAll?: boolean;
}): string {
  const parts = ['listings'];
  if (options.source) parts.push(options.source);
  if (options.exportAll) parts.push('all');
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .replace(/[:T]/g, '-')
    .slice(0, 16);
  parts.push(iso);
  return `${parts.join('_')}.csv`;
}
