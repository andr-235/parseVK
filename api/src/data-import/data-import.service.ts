import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { ListingImportDto } from './dto/listing-import.dto';
import type {
  ListingImportErrorDto,
  ListingImportReportDto,
} from './dto/listing-import-report.dto';
import type { ListingImportRequestDto } from './dto/listing-import-request.dto';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importListings(
    request: ListingImportRequestDto,
  ): Promise<ListingImportReportDto> {
    const errors: ListingImportErrorDto[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [index, item] of request.listings.entries()) {
      try {
        const url = typeof item.url === 'string' ? item.url.trim() : '';
        if (!url) {
          throw new Error('url обязателен');
        }

        try {
          // Проверяем, что строка является валидным URL.
          // eslint-disable-next-line no-new
          new URL(url);
        } catch {
          throw new Error('Некорректный формат URL');
        }

        const data = this.buildListingData({ ...item, url });

        if (request.updateExisting) {
          const existedRecord = await this.prisma.listing.findUnique({
            where: { url },
          });

          await this.prisma.listing.upsert({
            where: { url },
            create: data,
            update: existedRecord
              ? this.excludeManualOverrides(
                  data,
                  this.normalizeManualOverrides(
                    (existedRecord as { manualOverrides?: unknown }).manualOverrides,
                  ),
                )
              : data,
          });

          if (existedRecord) {
            updated += 1;
          } else {
            created += 1;
          }
        } else {
          await this.prisma.listing.create({
            data,
          });
          created += 1;
        }
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          skipped += 1;
          this.logger.warn({
            message: 'Объявление пропущено: дубликат URL',
            index,
            url: item.url,
          });
          continue;
        }

        skipped += 1;
        const message = this.mapPrismaError(error);
        errors.push({ index, url: item.url, message });
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

  private buildListingData(listing: ListingImportDto): Prisma.ListingCreateInput {
    const images = Array.isArray(listing.images)
      ? listing.images.filter((image) => typeof image === 'string' && image.trim().length > 0)
      : [];

    const metadata = this.metadataValue(listing.metadata);

    return {
      url: listing.url.trim(),
      source: this.stringValue(listing.source),
      externalId: this.stringValue(listing.externalId),
      title: this.stringValue(listing.title),
      description: this.stringValue(listing.description),
      price: this.integerValue(listing.price),
      currency: this.stringValue(listing.currency),
      address: this.stringValue(listing.address),
      city: this.stringValue(listing.city),
      latitude: this.floatValue(listing.latitude),
      longitude: this.floatValue(listing.longitude),
      rooms: this.integerValue(listing.rooms),
      areaTotal: this.floatValue(listing.areaTotal),
      areaLiving: this.floatValue(listing.areaLiving),
      areaKitchen: this.floatValue(listing.areaKitchen),
      floor: this.integerValue(listing.floor),
      floorsTotal: this.integerValue(listing.floorsTotal),
      publishedAt: this.dateValue(listing.publishedAt),
      contactName: this.stringValue(listing.contactName),
      contactPhone: this.stringValue(listing.contactPhone),
      images,
      metadata,
    };
  }

  private excludeManualOverrides(
    data: Prisma.ListingCreateInput,
    overrides: string[],
  ): Prisma.ListingUpdateInput {
    const manualFields = new Set(overrides);
    const update: Prisma.ListingUpdateInput = { ...data };

    for (const field of manualFields) {
      if (field in update) {
        delete (update as Record<string, unknown>)[field];
      }
    }

    // manualOverrides should stay untouched during import
    delete (update as Record<string, unknown>)['manualOverrides'];

    return update;
  }

  private normalizeManualOverrides(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item): item is string => item.length > 0);
  }

  private stringValue(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private integerValue(value?: string | number | null): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const numeric =
      typeof value === 'number' ? value : Number(String(value).replace(/\s+/g, ''));

    if (!Number.isFinite(numeric)) {
      return undefined;
    }

    return Math.round(numeric);
  }

  private floatValue(value?: string | number | null): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const numeric =
      typeof value === 'number' ? value : Number(String(value).replace(/\s+/g, '').replace(',', '.'));

    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private dateValue(value?: string | null): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private metadataValue(
    value: Record<string, unknown> | null | undefined,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === null) {
      return Prisma.JsonNull;
    }

    if (value === undefined) {
      return undefined;
    }

    return value as Prisma.InputJsonValue;
  }

  private isUniqueViolation(error: unknown): boolean {
    const KnownError =
      (Prisma as unknown as {
        PrismaClientKnownRequestError?: typeof Prisma.PrismaClientKnownRequestError;
      }).PrismaClientKnownRequestError;

    if (
      typeof KnownError === 'function' &&
      error instanceof KnownError &&
      (error as Prisma.PrismaClientKnownRequestError).code === 'P2002'
    ) {
      return true;
    }

    if (typeof error === 'object' && error && 'code' in error) {
      return (error as { code?: unknown }).code === 'P2002';
    }

    return false;
  }

  private mapPrismaError(error: unknown): string {
    const KnownError =
      (Prisma as unknown as {
        PrismaClientKnownRequestError?: typeof Prisma.PrismaClientKnownRequestError;
      }).PrismaClientKnownRequestError;

    if (typeof KnownError === 'function' && error instanceof KnownError) {
      return `Prisma error ${(error as Prisma.PrismaClientKnownRequestError).code}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Неизвестная ошибка базы данных';
  }
}
