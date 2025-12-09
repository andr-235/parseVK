import type { Listing } from '@prisma/client';
import type { ListingDto } from '../dto/listing.dto';

interface ListingWithOverrides extends Listing {
  manualOverrides?: unknown;
}

export class ListingMapper {
  static toDto(listing: ListingWithOverrides): ListingDto {
    const overrides = this.normalizeManualOverrides(listing.manualOverrides);

    return {
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
      sourceAuthorName: listing.sourceAuthorName ?? null,
      sourceAuthorPhone: listing.sourceAuthorPhone ?? null,
      sourceAuthorUrl: listing.sourceAuthorUrl ?? null,
      sourcePostedAt: listing.sourcePostedAt ?? null,
      sourceParsedAt: listing.sourceParsedAt
        ? listing.sourceParsedAt.toISOString()
        : null,
      manualOverrides: overrides,
      manualNote: listing.manualNote ?? null,
      archived: listing.archived ?? false,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }

  private static normalizeManualOverrides(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item): item is string => item.length > 0);
  }
}
