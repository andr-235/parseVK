import { Controller, Get, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';
import type { ListingsResponseDto } from './dto/listings-response.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  async getListings(
    @Query('page') pageParam?: string,
    @Query('pageSize') pageSizeParam?: string,
    @Query('search') searchParam?: string,
    @Query('source') sourceParam?: string,
  ): Promise<ListingsResponseDto> {
    const page = this.parseNumber(pageParam, 1, 1, 1000);
    const pageSize = this.parseNumber(pageSizeParam, 25, 1, 100);
    const search = this.normalizeString(searchParam);
    const source = this.normalizeSource(sourceParam);

    return this.listingsService.getListings({
      page,
      pageSize,
      search: search ?? undefined,
      source: source ?? undefined,
    });
  }

  private parseNumber(
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ): number {
    if (!value) {
      return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return defaultValue;
    }

    if (parsed < min) {
      return min;
    }

    if (parsed > max) {
      return max;
    }

    return parsed;
  }

  private normalizeString(value?: string): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeSource(value?: string): string | null {
    const normalized = this.normalizeString(value);
    if (!normalized) {
      return null;
    }

    if (normalized.toLowerCase() === 'all') {
      return null;
    }

    return normalized;
  }
}
