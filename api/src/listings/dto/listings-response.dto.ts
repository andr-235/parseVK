import type { ListingDto } from './listing.dto.js';

export interface ListingsResponseDto {
  items: ListingDto[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  sources: string[];
}
