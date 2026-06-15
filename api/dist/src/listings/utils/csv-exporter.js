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
];
export const CSV_FIELD_LABELS = {
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
export function escapeCsv(value) {
    if (value === null || value === undefined)
        return '';
    if (Array.isArray(value)) {
        return escapeCsv(value.join('; '));
    }
    const str = typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
            ? String(value)
            : JSON.stringify(value);
    const needsQuotes = /[",\n\r;]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}
export function formatCsvHeader(fields, labels = CSV_FIELD_LABELS) {
    return fields.map((field) => escapeCsv(labels[field] ?? field)).join(',');
}
export function formatCsvRow(item, fields) {
    return fields
        .map((key) => {
        const value = pickFieldValue(item, key);
        return escapeCsv(value);
    })
        .join(',');
}
function pickFieldValue(item, key) {
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
            return (item.publishedAt ?? item.sourcePostedAt ?? item.sourceParsedAt ?? '');
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
export function parseCsvFields(value) {
    const raw = (value ?? '').trim();
    if (!raw)
        return [...CSV_DEFAULT_FIELDS];
    const allowed = new Set(CSV_DEFAULT_FIELDS);
    const list = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const result = [];
    for (const key of list) {
        if (allowed.has(key)) {
            result.push(key);
        }
    }
    return result.length > 0 ? result : [...CSV_DEFAULT_FIELDS];
}
export function buildCsvFilename(options) {
    const parts = ['listings'];
    if (options.source)
        parts.push(options.source);
    if (options.exportAll)
        parts.push('all');
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .replace(/[:T]/g, '-')
        .slice(0, 16);
    parts.push(iso);
    return `${parts.join('_')}.csv`;
}
//# sourceMappingURL=csv-exporter.js.map