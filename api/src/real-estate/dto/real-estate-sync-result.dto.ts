import type { RealEstateListingEntity } from './real-estate-listing.dto';
import type { RealEstateSource } from './real-estate-source.enum';

export interface RealEstateSyncResultDto {
  source: RealEstateSource;
  scrapedCount: number;
  created: RealEstateListingEntity[];
  updated: RealEstateListingEntity[];
}
