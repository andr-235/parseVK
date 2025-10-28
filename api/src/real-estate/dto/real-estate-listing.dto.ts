import type { RealEstateSource } from './real-estate-source.enum';

export interface RealEstateListingDto {
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
}

export interface RealEstateListingEntity extends RealEstateListingDto {
  id: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
