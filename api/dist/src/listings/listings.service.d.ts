import type { IListingsRepository } from './interfaces/listings-repository.interface.js';
import type { SortableField } from './dto/listings-query.dto.js';
import type { ListingsResponseDto } from './dto/listings-response.dto.js';
import type { ListingDto } from './dto/listing.dto.js';
import type { UpdateListingDto } from './dto/update-listing.dto.js';
import type { CsvFieldKey } from './utils/csv-exporter.js';
interface GetListingsOptions {
    page: number;
    pageSize: number;
    search?: string;
    source?: string;
    archived?: boolean;
    sortBy?: SortableField;
    sortOrder?: 'asc' | 'desc';
}
interface ExportListingsOptions {
    search?: string;
    source?: string;
    archived?: boolean;
    limit?: number;
}
interface ExportAsCsvOptions {
    search?: string;
    source?: string;
    archived?: boolean;
    fields?: CsvFieldKey[];
    batchSize?: number;
}
export declare class ListingsService {
    private readonly repository;
    private readonly logger;
    constructor(repository: IListingsRepository);
    getListings(options: GetListingsOptions): Promise<ListingsResponseDto>;
    getListingsForExport(options: ExportListingsOptions): Promise<ListingDto[]>;
    private normalizeLimit;
    iterateAllListings(options: ExportListingsOptions & {
        batchSize?: number;
    }): AsyncGenerator<ListingDto[], void, unknown>;
    exportAsCsvLines(options: ExportAsCsvOptions): AsyncGenerator<string>;
    deleteListing(id: number): Promise<void>;
    updateListing(id: number, payload: UpdateListingDto): Promise<ListingDto>;
    private buildUpdateData;
    private has;
    private stringValue;
    private integerValue;
    private floatValue;
    private dateValue;
    private booleanValue;
    private imagesValue;
    private normalizeBatchSize;
    private normalizeManualOverrides;
}
export {};
