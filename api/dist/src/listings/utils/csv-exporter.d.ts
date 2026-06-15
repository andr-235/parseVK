import type { ListingDto } from '../dto/listing.dto.js';
export declare const CSV_DEFAULT_FIELDS: readonly ["id", "source", "title", "url", "price", "currency", "address", "sourceAuthorName", "sourceAuthorPhone", "sourceAuthorUrl", "publishedAt", "postedAt", "parsedAt", "images", "description", "manualNote"];
export type CsvFieldKey = (typeof CSV_DEFAULT_FIELDS)[number];
export declare const CSV_FIELD_LABELS: Record<CsvFieldKey, string>;
export declare function escapeCsv(value: unknown): string;
export declare function formatCsvHeader(fields: CsvFieldKey[], labels?: Record<CsvFieldKey, string>): string;
export declare function formatCsvRow(item: ListingDto, fields: CsvFieldKey[]): string;
export declare function parseCsvFields(value?: string): CsvFieldKey[];
export declare function buildCsvFilename(options: {
    source?: string;
    exportAll?: boolean;
}): string;
