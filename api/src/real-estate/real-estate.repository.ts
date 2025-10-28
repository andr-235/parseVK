import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RealEstateSource } from './dto/real-estate-source.enum';
import type {
  RealEstateListingDto,
  RealEstateListingEntity,
} from './dto/real-estate-listing.dto';

interface RealEstateListingRecord extends RealEstateListingEntity {}

interface RealEstateListingCreateInput {
  source: RealEstateSource;
  externalId: string;
  title: string;
  url: string;
  price: number | null;
  priceText: string | null;
  address: string | null;
  description: string | null;
  previewImage: string | null;
  metadata: Record<string, unknown> | null;
  publishedAt: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

interface RealEstateListingUpdateInput
  extends Partial<Omit<RealEstateListingCreateInput, 'firstSeenAt'>> {
  lastSeenAt: Date;
}

interface RealEstateListingDelegate {
  findMany(args: {
    where: {
      source: RealEstateSource;
      externalId: { in: string[] };
    };
  }): Promise<RealEstateListingRecord[]>;

  create(args: { data: RealEstateListingCreateInput }): Promise<RealEstateListingRecord>;

  update(args: {
    where: { id: number };
    data: RealEstateListingUpdateInput;
  }): Promise<RealEstateListingRecord>;
}

interface PrismaRealEstateAccessor {
  realEstateListing: RealEstateListingDelegate;
}

interface RealEstateSyncSummary {
  created: RealEstateListingEntity[];
  updated: RealEstateListingEntity[];
}

@Injectable()
export class RealEstateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async syncListings(
    source: RealEstateSource,
    listings: ReadonlyArray<RealEstateListingDto>,
  ): Promise<RealEstateSyncSummary> {
    if (listings.length === 0) {
      return { created: [], updated: [] };
    }

    const uniqueListings = this.deduplicate(listings);
    const externalIds = Array.from(uniqueListings.keys());
    const delegate = this.getDelegate(this.prisma);

    const existingRecords = await delegate.findMany({
      where: { source, externalId: { in: externalIds } },
    });

    const existingByExternalId = new Map(
      existingRecords.map((record) => [record.externalId, record]),
    );

    const now = new Date();
    const created: RealEstateListingEntity[] = [];
    const updated: RealEstateListingEntity[] = [];

    await this.prisma.$transaction(async (tx) => {
      const txDelegate = this.getDelegate(tx as unknown as PrismaService);

      for (const listing of uniqueListings.values()) {
        const record = existingByExternalId.get(listing.externalId);

        if (!record) {
          const createdRecord = await txDelegate.create({
            data: this.buildCreateInput(source, listing, now),
          });
          created.push(createdRecord);
          continue;
        }

        const updatePayload = this.buildUpdateInput(listing, record, now);

        if (updatePayload.hasChanges) {
          const updatedRecord = await txDelegate.update({
            where: { id: record.id },
            data: updatePayload.data,
          });
          updated.push(updatedRecord);
        } else {
          await txDelegate.update({
            where: { id: record.id },
            data: { lastSeenAt: now },
          });
        }
      }
    });

    return { created, updated };
  }

  private deduplicate(
    listings: ReadonlyArray<RealEstateListingDto>,
  ): Map<string, RealEstateListingDto> {
    const map = new Map<string, RealEstateListingDto>();

    for (const listing of listings) {
      map.set(listing.externalId, listing);
    }

    return map;
  }

  private buildCreateInput(
    source: RealEstateSource,
    listing: RealEstateListingDto,
    now: Date,
  ): RealEstateListingCreateInput {
    return {
      source,
      externalId: listing.externalId,
      title: listing.title,
      url: listing.url,
      price: listing.price,
      priceText: listing.priceText,
      address: listing.address,
      description: listing.description,
      previewImage: listing.previewImage,
      metadata: listing.metadata,
      publishedAt: listing.publishedAt,
      firstSeenAt: now,
      lastSeenAt: now,
    };
  }

  private buildUpdateInput(
    listing: RealEstateListingDto,
    record: RealEstateListingEntity,
    now: Date,
  ): { hasChanges: boolean; data: RealEstateListingUpdateInput } {
    const data: RealEstateListingUpdateInput = {
      lastSeenAt: now,
    };

    let hasChanges = false;

    if (record.title !== listing.title) {
      data.title = listing.title;
      hasChanges = true;
    }

    if (this.hasValueChanged(record.price, listing.price)) {
      data.price = listing.price;
      hasChanges = true;
    }

    if (record.priceText !== listing.priceText) {
      data.priceText = listing.priceText;
      hasChanges = true;
    }

    if (record.address !== listing.address) {
      data.address = listing.address;
      hasChanges = true;
    }

    if (record.description !== listing.description) {
      data.description = listing.description;
      hasChanges = true;
    }

    if (record.previewImage !== listing.previewImage) {
      data.previewImage = listing.previewImage;
      hasChanges = true;
    }

    if (!this.areDatesEqual(record.publishedAt, listing.publishedAt)) {
      data.publishedAt = listing.publishedAt;
      hasChanges = true;
    }

    if (!this.areMetadataEqual(record.metadata, listing.metadata)) {
      data.metadata = listing.metadata;
      hasChanges = true;
    }

    return { hasChanges, data };
  }

  private hasValueChanged(
    current: number | null,
    next: number | null,
  ): boolean {
    return (current ?? null) !== (next ?? null);
  }

  private areDatesEqual(first: Date, second: Date): boolean {
    return first.getTime() === second.getTime();
  }

  private areMetadataEqual(
    first: Record<string, unknown> | null,
    second: Record<string, unknown> | null,
  ): boolean {
    if (!first && !second) {
      return true;
    }

    if (!first || !second) {
      return false;
    }

    return JSON.stringify(first) === JSON.stringify(second);
  }

  private getDelegate(client: PrismaService): RealEstateListingDelegate {
    const accessor = client as unknown as PrismaRealEstateAccessor;

    if (!accessor.realEstateListing) {
      throw new Error('Prisma client is not configured with realEstateListing delegate');
    }

    return accessor.realEstateListing;
  }
}
