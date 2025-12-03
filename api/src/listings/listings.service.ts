import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Listing as ListingEntity } from '@prisma/client';
import type { IListingsRepository } from './interfaces/listings-repository.interface';
import { ListingMapper } from './mappers/listing.mapper';
import type { ListingsResponseDto } from './dto/listings-response.dto';
import type { ListingDto } from './dto/listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';

type ListingWithOverrides = ListingEntity & { manualOverrides?: unknown };

interface GetListingsOptions {
  page: number;
  pageSize: number;
  search?: string;
  source?: string;
  archived?: boolean;
}

interface ExportListingsOptions {
  search?: string;
  source?: string;
  archived?: boolean;
  /**
   * Максимальное количество записей для экспорта (защита от слишком больших выгрузок)
   */
  limit?: number;
}

/**
 * Сервис для управления объявлениями (listings)
 *
 * Обеспечивает получение, фильтрацию, экспорт и обновление объявлений
 * с поддержкой пагинации и поиска.
 */
@Injectable()
export class ListingsService {
  constructor(
    @Inject('IListingsRepository')
    private readonly repository: IListingsRepository,
  ) {}

  async getListings(options: GetListingsOptions): Promise<ListingsResponseDto> {
    const { page, pageSize, search, source, archived } = options;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ListingWhereInput = {};

    if (search) {
      const term = search.trim();
      if (term.length > 0) {
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
          { city: { contains: term, mode: 'insensitive' } },
          { externalId: { contains: term, mode: 'insensitive' } },
          { contactName: { contains: term, mode: 'insensitive' } },
          { contactPhone: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    if (source) {
      where.source = { equals: source, mode: 'insensitive' };
    }

    if (archived !== undefined) {
      where.archived = archived;
    } else {
      where.archived = false;
    }

    const { listings, total, distinctSources } =
      await this.repository.getListingsWithCountAndSources({
        where,
        skip,
        take: pageSize,
      });

    const items: ListingDto[] = listings.map((listing) =>
      ListingMapper.toDto(listing as ListingWithOverrides),
    );

    const sources = distinctSources
      .map((entry) => entry.source)
      .filter((value): value is string =>
        Boolean(value && value.trim().length > 0),
      );

    const hasMore = skip + listings.length < total;

    return {
      items,
      total,
      page,
      pageSize,
      hasMore,
      sources,
    };
  }

  async getListingsForExport(options: ExportListingsOptions) {
    const { search, source, archived } = options;
    const limit = this.normalizeLimit(options.limit);

    const where: Prisma.ListingWhereInput = {};
    const orderBy: Prisma.ListingOrderByWithRelationInput[] = [
      { sourceAuthorName: 'asc' },
      { contactName: 'asc' },
      { id: 'asc' },
    ];

    if (search) {
      const term = search.trim();
      if (term.length > 0) {
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
          { city: { contains: term, mode: 'insensitive' } },
          { externalId: { contains: term, mode: 'insensitive' } },
          { contactName: { contains: term, mode: 'insensitive' } },
          { contactPhone: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    if (source) {
      where.source = { equals: source, mode: 'insensitive' };
    }

    if (archived !== undefined) {
      where.archived = archived;
    } else {
      where.archived = false;
    }

    const listings = await this.repository.findMany({
      where,
      take: limit,
      orderBy,
    });

    const items: ListingDto[] = listings.map((listing) =>
      ListingMapper.toDto(listing as ListingWithOverrides),
    );

    return items;
  }

  private normalizeLimit(value?: number) {
    const DEFAULT_LIMIT = 10000;
    const MIN_LIMIT = 1;
    const MAX_LIMIT = 50000;
    if (typeof value !== 'number' || !Number.isFinite(value))
      return DEFAULT_LIMIT;
    if (value < MIN_LIMIT) return MIN_LIMIT;
    if (value > MAX_LIMIT) return MAX_LIMIT;
    return Math.floor(value);
  }

  async *iterateAllListings(
    options: ExportListingsOptions & { batchSize?: number },
  ) {
    const { search, source, archived } = options;
    const batchSize = this.normalizeBatchSize(options.batchSize);

    const where: Prisma.ListingWhereInput = {};
    const orderBy: Prisma.ListingOrderByWithRelationInput[] = [
      { sourceAuthorName: 'asc' },
      { contactName: 'asc' },
      { id: 'asc' },
    ];

    if (search) {
      const term = search.trim();
      if (term.length > 0) {
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
          { city: { contains: term, mode: 'insensitive' } },
          { externalId: { contains: term, mode: 'insensitive' } },
          { contactName: { contains: term, mode: 'insensitive' } },
          { contactPhone: { contains: term, mode: 'insensitive' } },
        ];
      }
    }
    if (source) {
      where.source = { equals: source, mode: 'insensitive' };
    }

    if (archived !== undefined) {
      where.archived = archived;
    } else {
      where.archived = false;
    }

    let cursorId: number | null = null;
    for (;;) {
      const listings = await this.repository.findMany({
        where,
        take: batchSize,
        orderBy,
        ...(cursorId !== null ? { cursor: { id: cursorId }, skip: 1 } : {}),
      });
      if (listings.length === 0) {
        break;
      }
      cursorId = listings[listings.length - 1].id;

      const items: ListingDto[] = listings.map((listing) =>
        ListingMapper.toDto(listing as ListingWithOverrides),
      );

      yield items;
    }
  }

  async updateListing(
    id: number,
    payload: UpdateListingDto,
  ): Promise<ListingDto> {
    const existingRecord = await this.repository.findUniqueOrThrow({ id });
    const existing = existingRecord as ListingWithOverrides;
    const data = this.buildUpdateData(payload, existing);
    if (Object.keys(data).length === 0) {
      return ListingMapper.toDto(existing);
    }

    const listing = await this.repository.update({ id }, data);

    return ListingMapper.toDto(listing as ListingWithOverrides);
  }

  private buildUpdateData(
    payload: UpdateListingDto,
    existing: ListingWithOverrides,
  ): Prisma.ListingUpdateInput {
    const data: Prisma.ListingUpdateInput = {};
    const currentOverrides = this.normalizeManualOverrides(
      existing.manualOverrides,
    );
    const overrides = new Set<string>(currentOverrides);
    let overridesDirty = false;

    if (this.has(payload, 'source')) {
      const value = this.stringValue(payload.source);
      if (value !== undefined && value !== existing.source) {
        data.source = value;
      }
    }

    if (this.has(payload, 'externalId')) {
      const value = this.stringValue(payload.externalId);
      if (value !== undefined && value !== existing.externalId) {
        data.externalId = value;
      }
    }

    if (this.has(payload, 'title')) {
      const value = this.stringValue(payload.title);
      if (value !== undefined && value !== existing.title) {
        data.title = value;
        if (!overrides.has('title')) {
          overrides.add('title');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'description')) {
      const value = this.stringValue(payload.description);
      if (value !== undefined && value !== existing.description) {
        data.description = value;
        if (!overrides.has('description')) {
          overrides.add('description');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'url')) {
      const value = this.stringValue(payload.url);
      if (value !== undefined && value !== existing.url) {
        data.url = value ?? undefined;
      }
    }

    if (this.has(payload, 'price')) {
      const value = this.integerValue(payload.price);
      if (value !== undefined && value !== existing.price) {
        data.price = value;
        if (!overrides.has('price')) {
          overrides.add('price');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'currency')) {
      const value = this.stringValue(payload.currency);
      if (value !== undefined && value !== existing.currency) {
        data.currency = value;
        if (!overrides.has('currency')) {
          overrides.add('currency');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'address')) {
      const value = this.stringValue(payload.address);
      if (value !== undefined && value !== existing.address) {
        data.address = value;
        if (!overrides.has('address')) {
          overrides.add('address');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'city')) {
      const value = this.stringValue(payload.city);
      if (value !== undefined && value !== existing.city) {
        data.city = value;
        if (!overrides.has('city')) {
          overrides.add('city');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'latitude')) {
      const value = this.floatValue(payload.latitude);
      if (value !== undefined && value !== existing.latitude) {
        data.latitude = value;
      }
    }

    if (this.has(payload, 'longitude')) {
      const value = this.floatValue(payload.longitude);
      if (value !== undefined && value !== existing.longitude) {
        data.longitude = value;
      }
    }

    if (this.has(payload, 'rooms')) {
      const value = this.integerValue(payload.rooms);
      if (value !== undefined && value !== existing.rooms) {
        data.rooms = value;
      }
    }

    if (this.has(payload, 'areaTotal')) {
      const value = this.floatValue(payload.areaTotal);
      if (value !== undefined && value !== existing.areaTotal) {
        data.areaTotal = value;
      }
    }

    if (this.has(payload, 'areaLiving')) {
      const value = this.floatValue(payload.areaLiving);
      if (value !== undefined && value !== existing.areaLiving) {
        data.areaLiving = value;
      }
    }

    if (this.has(payload, 'areaKitchen')) {
      const value = this.floatValue(payload.areaKitchen);
      if (value !== undefined && value !== existing.areaKitchen) {
        data.areaKitchen = value;
      }
    }

    if (this.has(payload, 'floor')) {
      const value = this.integerValue(payload.floor);
      if (value !== undefined && value !== existing.floor) {
        data.floor = value;
      }
    }

    if (this.has(payload, 'floorsTotal')) {
      const value = this.integerValue(payload.floorsTotal);
      if (value !== undefined && value !== existing.floorsTotal) {
        data.floorsTotal = value;
      }
    }

    if (this.has(payload, 'publishedAt')) {
      const value = this.dateValue(payload.publishedAt);
      const existingDate = existing.publishedAt
        ? existing.publishedAt.toISOString()
        : null;
      const nextDate = value ? value.toISOString() : null;
      if (value !== undefined && nextDate !== existingDate) {
        data.publishedAt = value;
      }
    }

    if (this.has(payload, 'contactName')) {
      const value = this.stringValue(payload.contactName);
      if (value !== undefined && value !== existing.contactName) {
        data.contactName = value;
        if (!overrides.has('contactName')) {
          overrides.add('contactName');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'contactPhone')) {
      const value = this.stringValue(payload.contactPhone);
      if (value !== undefined && value !== existing.contactPhone) {
        data.contactPhone = value;
        if (!overrides.has('contactPhone')) {
          overrides.add('contactPhone');
          overridesDirty = true;
        }
      }
    }

    if (this.has(payload, 'images')) {
      const value = this.imagesValue(payload.images);
      if (
        value !== undefined &&
        JSON.stringify(value) !== JSON.stringify(existing.images ?? [])
      ) {
        data.images = value;
      }
    }

    if (this.has(payload, 'sourceAuthorName')) {
      const value = this.stringValue(payload.sourceAuthorName);
      if (
        value !== undefined &&
        value !== (existing.sourceAuthorName ?? null)
      ) {
        data.sourceAuthorName = value;
      }
    }

    if (this.has(payload, 'sourceAuthorPhone')) {
      const value = this.stringValue(payload.sourceAuthorPhone);
      if (
        value !== undefined &&
        value !== (existing.sourceAuthorPhone ?? null)
      ) {
        data.sourceAuthorPhone = value;
      }
    }

    if (this.has(payload, 'sourceAuthorUrl')) {
      const value = this.stringValue(payload.sourceAuthorUrl);
      if (value !== undefined && value !== (existing.sourceAuthorUrl ?? null)) {
        data.sourceAuthorUrl = value;
      }
    }

    if (this.has(payload, 'sourcePostedAt')) {
      const value = this.stringValue(payload.sourcePostedAt);
      if (value !== undefined && value !== (existing.sourcePostedAt ?? null)) {
        data.sourcePostedAt = value;
      }
    }

    if (this.has(payload, 'sourceParsedAt')) {
      const value = this.dateValue(payload.sourceParsedAt);
      const existingDate = existing.sourceParsedAt
        ? existing.sourceParsedAt.toISOString()
        : null;
      const nextDate = value ? value.toISOString() : null;
      if (value !== undefined && nextDate !== existingDate) {
        data.sourceParsedAt = value;
      }
    }

    if (this.has(payload, 'manualNote')) {
      const value = this.stringValue(payload.manualNote);
      if (value !== undefined && value !== (existing.manualNote ?? null)) {
        (data as Record<string, unknown>).manualNote = value;
      }
    }

    if (this.has(payload, 'archived')) {
      const value = this.booleanValue(payload.archived);
      if (value !== undefined && value !== (existing.archived ?? false)) {
        (data as Record<string, unknown>).archived = value;
      }
    }

    if (overridesDirty) {
      (data as Record<string, unknown>)['manualOverrides'] =
        Array.from(overrides);
    }

    return data;
  }

  private has(payload: UpdateListingDto, key: keyof UpdateListingDto): boolean {
    return Object.prototype.hasOwnProperty.call(payload, key);
  }

  private stringValue(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private integerValue(value?: number | null): number | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return Math.round(value);
  }

  private floatValue(value?: number | null): number | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    return Number.isFinite(value) ? value : undefined;
  }

  private dateValue(value?: string | null): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private booleanValue(value?: boolean | null): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }
    return Boolean(value);
  }

  private imagesValue(value?: string[] | null): string[] | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return [];
    }
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((image) => (typeof image === 'string' ? image.trim() : ''))
      .filter((image) => image.length > 0);
  }

  private normalizeBatchSize(value?: number) {
    const DEFAULT = 1000;
    const MIN = 100;
    const MAX = 5000;
    if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT;
    if (value < MIN) return MIN;
    if (value > MAX) return MAX;
    return Math.floor(value);
  }

  private normalizeManualOverrides(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item): item is string => item.length > 0);
  }
}
