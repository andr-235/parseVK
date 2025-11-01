import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { ListingImportDto } from './dto/listing-import.dto';
import type {
  ListingImportErrorDto,
  ListingImportReportDto,
} from './dto/listing-import-report.dto';
import type { ListingImportRequestDto } from './dto/listing-import-request.dto';

interface NormalizedListing {
  url: string;
  source?: string;
  externalId?: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  rooms?: number;
  areaTotal?: number;
  areaLiving?: number;
  areaKitchen?: number;
  floor?: number;
  floorsTotal?: number;
  publishedAt?: Date;
  contactName?: string;
  contactPhone?: string;
  images: string[];
  metadata?: Prisma.InputJsonValue | null;
}

interface NormalizedEntry {
  index: number;
  listing: NormalizedListing;
  originalUrl?: string;
}

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importListings(
    request: ListingImportRequestDto,
  ): Promise<ListingImportReportDto> {
    const errors: ListingImportErrorDto[] = [];
    const normalizedListings: NormalizedEntry[] = [];

    request.listings.forEach((item, index) => {
      try {
        const normalized = this.normalizeListing(item);
        normalizedListings.push({
          index,
          listing: normalized,
          originalUrl: item.url,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ошибка нормализации объявления';
        errors.push({ index, url: item.url, message });
        this.logger.warn({
          message: 'Объявление пропущено из-за ошибки нормализации',
          index,
          url: item.url,
          error: message,
        });
      }
    });

    let created = 0;
    let updated = 0;
    let skipped = request.listings.length - normalizedListings.length;

    if (normalizedListings.length === 0) {
      const emptyReport: ListingImportReportDto = {
        processed: request.listings.length,
        created,
        updated,
        skipped,
        failed: errors.length,
        errors,
      };
      return emptyReport;
    }

    if (request.updateExisting) {
      for (const entry of normalizedListings) {
        try {
          const existed = await this.prisma.listing.findUnique({
            where: { url: entry.listing.url },
            select: { id: true },
          });

          await this.prisma.listing.upsert({
            where: { url: entry.listing.url },
            create: this.mapToCreateInput(entry.listing),
            update: this.mapToUpdateInput(entry.listing),
          });

          if (existed) {
            updated += 1;
          } else {
            created += 1;
          }
        } catch (error) {
          const message = this.mapPrismaError(error);
          errors.push({ index: entry.index, url: entry.originalUrl, message });
          this.logger.error(
            {
              message: 'Не удалось сохранить объявление в режиме upsert',
              index: entry.index,
              url: entry.originalUrl,
              error: message,
            },
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    } else {
      try {
        const createManyData = normalizedListings.map((entry) =>
          this.mapToCreateManyInput(entry.listing),
        );
        const result = await this.prisma.listing.createMany({
          data: createManyData,
          skipDuplicates: true,
        });
        created = result.count;
        skipped += normalizedListings.length - result.count;
      } catch (bulkError) {
        this.logger.error(
          {
            message: 'Ошибка пакетного импорта объявлений, выполняется поштучная вставка',
            error: this.mapPrismaError(bulkError),
          },
          bulkError instanceof Error ? bulkError.stack : undefined,
        );

        for (const entry of normalizedListings) {
          try {
            await this.prisma.listing.create({
              data: this.mapToCreateInput(entry.listing),
            });
            created += 1;
          } catch (error) {
            if (this.isUniqueViolation(error)) {
              skipped += 1;
              continue;
            }

            const message = this.mapPrismaError(error);
            errors.push({ index: entry.index, url: entry.originalUrl, message });
            this.logger.error(
              {
                message: 'Ошибка сохранения объявления при поштучной вставке',
                index: entry.index,
                url: entry.originalUrl,
                error: message,
              },
              error instanceof Error ? error.stack : undefined,
            );
          }
        }
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

  private normalizeListing(dto: ListingImportDto): NormalizedListing {
    const url = dto.url?.trim();
    if (!url) {
      throw new Error('url обязателен');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Некорректный формат URL');
    }

    const price = this.normalizeInteger(dto.price);
    const latitude = this.normalizeFloat(dto.latitude);
    const longitude = this.normalizeFloat(dto.longitude);
    const rooms = this.normalizeInteger(dto.rooms);
    const areaTotal = this.normalizeFloat(dto.areaTotal);
    const areaLiving = this.normalizeFloat(dto.areaLiving);
    const areaKitchen = this.normalizeFloat(dto.areaKitchen);
    const floor = this.normalizeInteger(dto.floor);
    const floorsTotal = this.normalizeInteger(dto.floorsTotal);

    const publishedAt = this.normalizeDate(dto.publishedAt);

    const images = Array.isArray(dto.images)
      ? dto.images
          .map((image) => image.trim())
          .filter((image) => image.length > 0)
      : [];

    const metadata = this.normalizeMetadata(dto.metadata);

    const normalized: NormalizedListing = {
      url: parsedUrl.toString(),
      source: this.normalizeString(dto.source),
      externalId: this.normalizeString(dto.externalId),
      title: this.normalizeString(dto.title),
      description: this.normalizeString(dto.description),
      price: price ?? undefined,
      currency: this.normalizeString(dto.currency),
      address: this.normalizeString(dto.address),
      city: this.normalizeString(dto.city),
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      rooms: rooms ?? undefined,
      areaTotal: areaTotal ?? undefined,
      areaLiving: areaLiving ?? undefined,
      areaKitchen: areaKitchen ?? undefined,
      floor: floor ?? undefined,
      floorsTotal: floorsTotal ?? undefined,
      publishedAt: publishedAt ?? undefined,
      contactName: this.normalizeString(dto.contactName),
      contactPhone: this.normalizePhone(dto.contactPhone),
      images,
    };

    if (metadata !== undefined) {
      normalized.metadata = metadata;
    }

    return normalized;
  }

  private normalizeString(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private normalizePhone(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const digits = value.replace(/[^+\d]/g, '');
    return digits.length > 0 ? digits : undefined;
  }

  private normalizeInteger(value: string | number | null | undefined): number | null {
    const numeric = this.normalizeNumber(value);
    if (numeric === null) {
      return null;
    }

    return Math.round(numeric);
  }

  private normalizeFloat(value: string | number | null | undefined): number | null {
    const numeric = this.normalizeNumber(value);
    if (numeric === null) {
      return null;
    }

    return Number(numeric.toFixed(3));
  }

  private normalizeNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
      if (cleaned.trim().length === 0) {
        return null;
      }

      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Некорректное значение publishedAt');
    }

    return date;
  }

  private normalizeMetadata(
    value: unknown,
  ): Prisma.InputJsonValue | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('metadata должен быть объектом');
    }

    try {
      return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch {
      throw new Error('metadata содержит неподдерживаемые значения');
    }
  }

  private mapToCreateManyInput(
    listing: NormalizedListing,
  ): Prisma.ListingCreateManyInput {
    return {
      url: listing.url,
      source: listing.source,
      externalId: listing.externalId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currency: listing.currency,
      address: listing.address,
      city: listing.city,
      latitude: listing.latitude,
      longitude: listing.longitude,
      rooms: listing.rooms,
      areaTotal: listing.areaTotal,
      areaLiving: listing.areaLiving,
      areaKitchen: listing.areaKitchen,
      floor: listing.floor,
      floorsTotal: listing.floorsTotal,
      publishedAt: listing.publishedAt,
      contactName: listing.contactName,
      contactPhone: listing.contactPhone,
      images: listing.images,
      metadata:
        listing.metadata === null
          ? Prisma.JsonNull
          : listing.metadata ?? undefined,
    };
  }

  private mapToCreateInput(listing: NormalizedListing): Prisma.ListingCreateInput {
    return {
      ...this.mapToCreateManyInput(listing),
    };
  }

  private mapToUpdateInput(listing: NormalizedListing): Prisma.ListingUpdateInput {
    return {
      source: listing.source,
      externalId: listing.externalId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currency: listing.currency,
      address: listing.address,
      city: listing.city,
      latitude: listing.latitude,
      longitude: listing.longitude,
      rooms: listing.rooms,
      areaTotal: listing.areaTotal,
      areaLiving: listing.areaLiving,
      areaKitchen: listing.areaKitchen,
      floor: listing.floor,
      floorsTotal: listing.floorsTotal,
      publishedAt: listing.publishedAt,
      contactName: listing.contactName,
      contactPhone: listing.contactPhone,
      images: { set: listing.images },
      metadata:
        listing.metadata === null
          ? Prisma.JsonNull
          : listing.metadata ?? undefined,
    };
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
