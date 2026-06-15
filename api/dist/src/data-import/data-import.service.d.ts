import type { IListingsRepository } from '../listings/interfaces/listings-repository.interface.js';
import type { ListingImportReportDto } from './dto/listing-import-report.dto.js';
import type { ListingImportRequestDto } from './dto/listing-import-request.dto.js';
import { ListingValidatorService } from './services/listing-validator.service.js';
import { ListingNormalizerService } from './services/listing-normalizer.service.js';
export declare class DataImportService {
    private readonly listingsRepository;
    private readonly validator;
    private readonly normalizer;
    private readonly logger;
    constructor(listingsRepository: IListingsRepository, validator: ListingValidatorService, normalizer: ListingNormalizerService);
    importListings(request: ListingImportRequestDto): Promise<ListingImportReportDto>;
}
