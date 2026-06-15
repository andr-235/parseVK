import type { ListingCreateData, ListingUpdateData } from '../../listings/interfaces/listings-repository.interface.js';
import type { ListingImportDto } from '../dto/listing-import.dto.js';
export declare class ListingNormalizerService {
    buildListingData(listing: ListingImportDto): ListingCreateData;
    excludeManualOverrides(data: ListingCreateData, overrides: string[]): ListingUpdateData;
    normalizeManualOverrides(value: unknown): string[];
    private normalizeMetadata;
    private resolveSourceString;
    private resolveSourceDate;
    private stringValue;
    private integerValue;
    private floatValue;
    private dateValue;
}
