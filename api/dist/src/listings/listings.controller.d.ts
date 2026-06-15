import { ListingsService } from './listings.service.js';
import type { ListingsResponseDto } from './dto/listings-response.dto.js';
import type { ListingDto } from './dto/listing.dto.js';
import type { Response } from 'express';
import type { UpdateListingDto } from './dto/update-listing.dto.js';
import { ListingsQueryDto } from './dto/listings-query.dto.js';
import { ListingIdParamDto } from './dto/listing-id-param.dto.js';
export declare class ListingsController {
    private readonly listingsService;
    constructor(listingsService: ListingsService);
    getListings(query: ListingsQueryDto): Promise<ListingsResponseDto>;
    exportListingsCsv(searchParam?: string, sourceParam?: string, archivedParam?: string, allParam?: string, fieldsParam?: string, res?: Response): Promise<void>;
    updateListing(params: ListingIdParamDto, payload: UpdateListingDto): Promise<ListingDto>;
    deleteListing(params: ListingIdParamDto): Promise<void>;
}
