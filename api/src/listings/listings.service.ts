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
}
