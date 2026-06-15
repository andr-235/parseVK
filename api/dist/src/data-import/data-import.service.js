var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DataImportService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ListingValidatorService } from './services/listing-validator.service.js';
import { ListingNormalizerService } from './services/listing-normalizer.service.js';
let DataImportService = DataImportService_1 = class DataImportService {
    listingsRepository;
    validator;
    normalizer;
    logger = new Logger(DataImportService_1.name);
    constructor(listingsRepository, validator, normalizer) {
        this.listingsRepository = listingsRepository;
        this.validator = validator;
        this.normalizer = normalizer;
    }
    async importListings(request) {
        const errors = [];
        let created = 0;
        let updated = 0;
        let skipped = 0;
        for (const [index, item] of request.listings.entries()) {
            try {
                const rawUrl = typeof item.url === 'string' ? item.url.trim() : '';
                if (!rawUrl) {
                    throw new Error('url обязателен');
                }
                let url;
                try {
                    url = this.validator.normalizeUrl(rawUrl);
                }
                catch {
                    throw new Error('Некорректный формат URL');
                }
                const data = this.normalizer.buildListingData({ ...item, url });
                const shouldUpdateExisting = request.updateExisting !== false;
                if (shouldUpdateExisting) {
                    const existedRecord = await this.listingsRepository.findUniqueByUrl({
                        url,
                    });
                    if (existedRecord) {
                        const updateData = this.normalizer.excludeManualOverrides(data, this.normalizer.normalizeManualOverrides(existedRecord
                            .manualOverrides));
                        await this.listingsRepository.upsert({ url }, data, updateData);
                        updated += 1;
                    }
                    else {
                        await this.listingsRepository.upsert({ url }, data);
                        created += 1;
                    }
                }
                else {
                    await this.listingsRepository.transaction(async (tx) => {
                        await tx.listing.create({ data });
                    });
                    created += 1;
                }
            }
            catch (error) {
                if (this.validator.isUniqueViolation(error)) {
                    skipped += 1;
                    this.logger.warn({
                        message: 'Объявление пропущено: дубликат URL',
                        index,
                        url: item.url,
                    });
                    continue;
                }
                skipped += 1;
                const message = this.validator.mapPrismaError(error);
                errors.push({
                    index,
                    url: typeof item.url === 'string' ? item.url : undefined,
                    message,
                });
                this.logger.error({
                    message: 'Не удалось импортировать объявление',
                    index,
                    url: item.url,
                    error: message,
                }, error instanceof Error ? error.stack : undefined);
            }
        }
        const report = {
            processed: request.listings.length,
            created,
            updated,
            skipped,
            failed: errors.length,
            errors,
        };
        this.logger.log({ message: 'Импорт объявлений завершен', ...report });
        return report;
    }
};
DataImportService = DataImportService_1 = __decorate([
    Injectable(),
    __param(0, Inject('IListingsRepository')),
    __metadata("design:paramtypes", [Object, ListingValidatorService,
        ListingNormalizerService])
], DataImportService);
export { DataImportService };
//# sourceMappingURL=data-import.service.js.map