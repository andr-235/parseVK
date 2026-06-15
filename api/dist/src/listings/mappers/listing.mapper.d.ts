import type { ListingDto } from '../dto/listing.dto.js';
import type { ListingRecord } from '../types/listing-record.type.js';
type ListingWithOverrides = ListingRecord & {
    manualOverrides?: unknown;
};
export declare class ListingMapper {
    static toDto(listing: ListingWithOverrides): ListingDto;
    private static normalizeManualOverrides;
    private static normalizeDateValue;
}
export {};
