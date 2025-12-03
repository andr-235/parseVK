import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { IListingsRepository } from '../listings/interfaces/listings-repository.interface';
import type { ListingImportDto } from './dto/listing-import.dto';
import type {
  ListingImportErrorDto,
  ListingImportReportDto,
} from './dto/listing-import-report.dto';
import type { ListingImportRequestDto } from './dto/listing-import-request.dto';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(
    @Inject('IListingsRepository')
    private readonly listingsRepository: IListingsRepository,
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
          url = this.normalizeUrl(rawUrl);
        } catch {
          throw new Error('Некорректный формат URL');
        }

        const data = this.buildListingData({ ...item, url });
        const shouldUpdateExisting = request.updateExisting !== false;

        if (shouldUpdateExisting) {
          const existedRecord = await this.listingsRepository.findUniqueByUrl({
            url,
          });

          if (existedRecord) {
            const updateData = this.excludeManualOverrides(
              data,
              this.normalizeManualOverrides(
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

  private buildListingData(
    listing: ListingImportDto,
  ): Prisma.ListingCreateInput {
    const images = Array.isArray(listing.images)
      ? listing.images.filter(
          (image) => typeof image === 'string' && image.trim().length > 0,
        )
      : [];

    const metadata = this.normalizeMetadata(listing.metadata);
    const sourceAuthorName = this.resolveSourceString(
      listing.sourceAuthorName,
      metadata,
      ['author', 'author_name', 'contact_name', 'contactName'],
    );
    const sourceAuthorPhone = this.resolveSourceString(
      listing.sourceAuthorPhone,
      metadata,
      ['author_phone', 'contact_phone', 'phone'],
    );
    const sourceAuthorUrl = this.resolveSourceString(
      listing.sourceAuthorUrl,
      metadata,
      ['author_url', 'url'],
    );
    const sourcePostedAt = this.resolveSourceString(
      listing.sourcePostedAt,
      metadata,
      ['posted_at', 'postedAt', 'published_at', 'publishedAt'],
    );
    const sourceParsedAt = this.resolveSourceDate(
      listing.sourceParsedAt,
      metadata,
      ['parsed_at', 'parsedAt'],
    );

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
      sourceAuthorName,
      sourceAuthorPhone,
      sourceAuthorUrl,
      sourcePostedAt,
      sourceParsedAt,
    };
  }

  private normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('URL пустой');
    }

    const parsed = new URL(trimmed);
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.toLowerCase();

    let pathname = parsed.pathname.replace(/\/{2,}/g, '/');
    if (pathname.length === 0) {
      pathname = '/';
    } else if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    return `${parsed.protocol}//${parsed.host}${pathname}`;
  }

  private normalizeMetadata(
    metadata: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> | null {
    if (!metadata) {
      return null;
    }

    if (Array.isArray(metadata)) {
      return null;
    }

    if (typeof metadata !== 'object') {
      return null;
    }

    return { ...metadata };
  }

  private resolveSourceString(
    direct: string | null | undefined,
    metadata: Record<string, unknown> | null,
    keys: string[],
  ): string | null | undefined {
    const directValue = this.stringValue(direct);
    if (directValue !== undefined) {
      return directValue;
    }

    if (!metadata) {
      return undefined;
    }

    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
        continue;
      }

      const raw = metadata[key];
      if (typeof raw === 'string' || raw === null) {
        const normalized = this.stringValue(raw as string | null | undefined);
        if (normalized !== undefined) {
          return normalized;
        }
      }
    }

    return undefined;
  }

  private resolveSourceDate(
    direct: string | null | undefined,
    metadata: Record<string, unknown> | null,
    keys: string[],
  ): Date | undefined {
    if (direct !== undefined) {
      const parsed = this.dateValue(direct);
      if (parsed !== undefined) {
        return parsed;
      }
    }

    if (!metadata) {
      return undefined;
    }

    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
        continue;
      }
      const raw = metadata[key];
      if (typeof raw === 'string') {
        const parsed = this.dateValue(raw);
        if (parsed !== undefined) {
          return parsed;
        }
      }
    }

    return undefined;
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
      typeof value === 'number'
        ? value
        : Number(String(value).replace(/\s+/g, ''));

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
      typeof value === 'number'
        ? value
        : Number(String(value).replace(/\s+/g, '').replace(',', '.'));

    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private dateValue(value?: string | null): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private isUniqueViolation(error: unknown): boolean {
    const KnownError = (
      Prisma as unknown as {
        PrismaClientKnownRequestError?: typeof Prisma.PrismaClientKnownRequestError;
      }
    ).PrismaClientKnownRequestError;

    if (
      typeof KnownError === 'function' &&
      error instanceof KnownError &&
      error.code === 'P2002'
    ) {
      return true;
    }

    if (typeof error === 'object' && error && 'code' in error) {
      return (error as { code?: unknown }).code === 'P2002';
    }

    return false;
  }

  private mapPrismaError(error: unknown): string {
    const KnownError = (
      Prisma as unknown as {
        PrismaClientKnownRequestError?: typeof Prisma.PrismaClientKnownRequestError;
      }
    ).PrismaClientKnownRequestError;

    if (typeof KnownError === 'function' && error instanceof KnownError) {
      return `Prisma error ${error.code}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Неизвестная ошибка базы данных';
  }
}
