import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type { ListingsResponseDto } from './dto/listings-response.dto';
import type { ListingDto } from './dto/listing.dto';

interface GetListingsOptions {
  page: number;
  pageSize: number;
  search?: string;
  source?: string;
}

interface ExportListingsOptions {
  search?: string;
  source?: string;
  /**
   * Максимальное количество записей для экспорта (защита от слишком больших выгрузок)
   */
  limit?: number;
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getListings(options: GetListingsOptions): Promise<ListingsResponseDto> {
    const { page, pageSize, search, source } = options;
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

    const [listings, total, distinctSources] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where: { source: { not: null, notIn: [''] } },
        distinct: ['source'],
        select: { source: true },
        orderBy: { source: 'asc' },
      }),
    ]);

    const items: ListingDto[] = listings.map((listing) => ({
      id: listing.id,
      source: listing.source ?? null,
      externalId: listing.externalId ?? null,
      title: listing.title ?? null,
      description: listing.description ?? null,
      url: listing.url,
      price: listing.price ?? null,
      currency: listing.currency ?? null,
      address: listing.address ?? null,
      city: listing.city ?? null,
      latitude: listing.latitude ?? null,
      longitude: listing.longitude ?? null,
      rooms: listing.rooms ?? null,
      areaTotal: listing.areaTotal ?? null,
      areaLiving: listing.areaLiving ?? null,
      areaKitchen: listing.areaKitchen ?? null,
      floor: listing.floor ?? null,
      floorsTotal: listing.floorsTotal ?? null,
      publishedAt: listing.publishedAt
        ? listing.publishedAt.toISOString()
        : null,
      contactName: listing.contactName ?? null,
      contactPhone: listing.contactPhone ?? null,
      images: listing.images ?? [],
      metadata: listing.metadata ?? null,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }));

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
    const { search, source } = options;
    const limit = this.normalizeLimit(options.limit);

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

    const listings = await this.prisma.listing.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const items: ListingDto[] = listings.map((listing) => ({
      id: listing.id,
      source: listing.source ?? null,
      externalId: listing.externalId ?? null,
      title: listing.title ?? null,
      description: listing.description ?? null,
      url: listing.url,
      price: listing.price ?? null,
      currency: listing.currency ?? null,
      address: listing.address ?? null,
      city: listing.city ?? null,
      latitude: listing.latitude ?? null,
      longitude: listing.longitude ?? null,
      rooms: listing.rooms ?? null,
      areaTotal: listing.areaTotal ?? null,
      areaLiving: listing.areaLiving ?? null,
      areaKitchen: listing.areaKitchen ?? null,
      floor: listing.floor ?? null,
      floorsTotal: listing.floorsTotal ?? null,
      publishedAt: listing.publishedAt ? listing.publishedAt.toISOString() : null,
      contactName: listing.contactName ?? null,
      contactPhone: listing.contactPhone ?? null,
      images: listing.images ?? [],
      metadata: listing.metadata ?? null,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }));

    return items;
  }

  private normalizeLimit(value?: number) {
    const DEFAULT_LIMIT = 10000;
    const MIN_LIMIT = 1;
    const MAX_LIMIT = 50000;
    if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_LIMIT;
    if (value < MIN_LIMIT) return MIN_LIMIT;
    if (value > MAX_LIMIT) return MAX_LIMIT;
    return Math.floor(value);
  }

  async *iterateAllListings(options: ExportListingsOptions & { batchSize?: number }) {
    const { search, source } = options;
    const batchSize = this.normalizeBatchSize(options.batchSize);

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

    let lastId = 0;
    for (;;) {
      const listings = await this.prisma.listing.findMany({
        where: { ...where, id: { gt: lastId } },
        take: batchSize,
        orderBy: { id: 'asc' },
      });
      if (listings.length === 0) {
        break;
      }
      lastId = listings[listings.length - 1].id;

      const items: ListingDto[] = listings.map((listing) => ({
        id: listing.id,
        source: listing.source ?? null,
        externalId: listing.externalId ?? null,
        title: listing.title ?? null,
        description: listing.description ?? null,
        url: listing.url,
        price: listing.price ?? null,
        currency: listing.currency ?? null,
        address: listing.address ?? null,
        city: listing.city ?? null,
        latitude: listing.latitude ?? null,
        longitude: listing.longitude ?? null,
        rooms: listing.rooms ?? null,
        areaTotal: listing.areaTotal ?? null,
        areaLiving: listing.areaLiving ?? null,
        areaKitchen: listing.areaKitchen ?? null,
        floor: listing.floor ?? null,
        floorsTotal: listing.floorsTotal ?? null,
        publishedAt: listing.publishedAt ? listing.publishedAt.toISOString() : null,
        contactName: listing.contactName ?? null,
        contactPhone: listing.contactPhone ?? null,
        images: listing.images ?? [],
        metadata: listing.metadata ?? null,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
      }));

      yield items;
    }
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
}
