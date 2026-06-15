import { DataImportService } from './data-import.service.js';
import type { ListingImportReportDto } from './dto/listing-import-report.dto.js';
export declare class DataImportController {
    private readonly dataImportService;
    constructor(dataImportService: DataImportService);
    importData(body: unknown): Promise<ListingImportReportDto>;
    private validateBody;
    private normalizeRequestBody;
    private sanitizeListingArray;
    private sanitizeListingItem;
    private extractMetadata;
    private isPlainObject;
    private flattenErrors;
}
