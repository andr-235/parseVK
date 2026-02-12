import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import type { ListingsResponseDto } from './dto/listings-response.dto.js';
import type { ListingDto } from './dto/listing.dto.js';
import type { Response } from 'express';
import type { UpdateListingDto } from './dto/update-listing.dto.js';
import { ListingsQueryDto } from './dto/listings-query.dto.js';
import { ListingIdParamDto } from './dto/listing-id-param.dto.js';
import { buildCsvFilename, parseCsvFields } from './utils/csv-exporter.js';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  async getListings(
    @Query() query: ListingsQueryDto,
  ): Promise<ListingsResponseDto> {
    return this.listingsService.getListings({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 25,
      search: query.search,
      source: query.source,
      archived: query.archived,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('export')
  async exportListingsCsv(
    @Query('search') searchParam?: string,
    @Query('source') sourceParam?: string,
    @Query('archived') archivedParam?: string,
    @Query('all') allParam?: string,
    @Query('fields') fieldsParam?: string,
    @Res() res?: Response,
  ) {
    const exportAll =
      (allParam ?? '').toLowerCase() === '1' ||
      (allParam ?? '').toLowerCase() === 'true';

    const search = exportAll
      ? undefined
      : (normalizeString(searchParam) ?? undefined);
    const source = exportAll
      ? undefined
      : (normalizeSource(sourceParam) ?? undefined);
    const archived = exportAll
      ? undefined
      : (parseBoolean(archivedParam) ?? undefined);
    const fields = parseCsvFields(fieldsParam);

    const filename = buildCsvFilename({ source, exportAll });

    res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res?.write('\uFEFF');

    for await (const line of this.listingsService.exportAsCsvLines({
      search,
      source,
      archived,
      fields,
    })) {
      res?.write(line);
    }

    res?.end();
  }

  @Patch(':id')
  async updateListing(
    @Param() params: ListingIdParamDto,
    @Body() payload: UpdateListingDto,
  ): Promise<ListingDto> {
    return this.listingsService.updateListing(params.id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteListing(@Param() params: ListingIdParamDto): Promise<void> {
    return this.listingsService.deleteListing(params.id);
  }
}

function normalizeString(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSource(value?: string): string | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  if (normalized.toLowerCase() === 'all') return null;
  return normalized;
}

function parseBoolean(value?: string): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes')
    return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no')
    return false;
  return null;
}
