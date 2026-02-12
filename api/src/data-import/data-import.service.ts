import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IListingsRepository } from '../listings/interfaces/listings-repository.interface.js';
import type {
  ListingImportErrorDto,
  ListingImportReportDto,
} from './dto/listing-import-report.dto.js';
import type { ListingImportRequestDto } from './dto/listing-import-request.dto.js';
import { ListingValidatorService } from './services/listing-validator.service.js';
import { ListingNormalizerService } from './services/listing-normalizer.service.js';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(
    @Inject('IListingsRepository')
    private readonly listingsRepository: IListingsRepository,
    private readonly validator: ListingValidatorService,
    private readonly normalizer: ListingNormalizerService,
  ) {}

  async importListings(
    request: ListingImportRequestDto,
  ): Promise<ListingImportReportDto> {
    const errors: ListingImportErrorDto[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [index, item] of request.listings.entries()) {
      try {
        const rawUrl = typeof item.url === 'string' ? item.url.trim() : '';
        if (!rawUrl) {
          throw new Error('url обязателен');
        }

        let url: string;
        try {
          url = this.validator.normalizeUrl(rawUrl);
        } catch {
          throw new Error('Некорректный формат URL');
        }

        const data = this.normalizer.buildListingData({ ...item, url });
        const shouldUpdateExisting = request.updateExisting !== false;

        if (shouldUpdateExisting) {
          const existedRecord = await this.listingsRepository.findUniqueByUrl({
            url,
          });

          if (existedRecord) {
            const updateData = this.normalizer.excludeManualOverrides(
              data,
              this.normalizer.normalizeManualOverrides(
                (existedRecord as { manualOverrides?: unknown })
                  .manualOverrides,
              ),
            );
            await this.listingsRepository.upsert({ url }, data, updateData);
            updated += 1;
          } else {
            await this.listingsRepository.upsert({ url }, data);
            created += 1;
          }
        } else {
          await this.listingsRepository.transaction(async (tx) => {
            await tx.listing.create({ data });
          });
          created += 1;
        }
      } catch (error) {
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
        this.logger.error(
          {
            message: 'Не удалось импортировать объявление',
            index,
            url: item.url,
            error: message,
          },
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    const report: ListingImportReportDto = {
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
}
