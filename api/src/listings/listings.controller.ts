import { Body, Controller, Get, Param, Patch, Query, Res } from '@nestjs/common';
import { ListingsService } from './listings.service';
import type { ListingsResponseDto } from './dto/listings-response.dto';
import type { ListingDto } from './dto/listing.dto';
import type { Response } from 'express';
import type { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsQueryDto } from './dto/listings-query.dto';
import { ListingIdParamDto } from './dto/listing-id-param.dto';

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
    const exportAll = (allParam ?? '').toLowerCase() === '1' || (allParam ?? '').toLowerCase() === 'true';
    const search = exportAll ? undefined : this.normalizeString(searchParam) ?? undefined;
    const source = exportAll ? undefined : this.normalizeSource(sourceParam) ?? undefined;
    const archived = exportAll ? undefined : this.parseBoolean(archivedParam) ?? undefined;

    const defaultFields = [
      'id',
      'source',
      'title',
      'url',
      'price',
      'currency',
      'address',
      'sourceAuthorName',
      'sourceAuthorPhone',
      'sourceAuthorUrl',
      'publishedAt',
      'postedAt',
      'parsedAt',
      'images',
      'description',
      'manualNote',
    ] as const;
    type FieldKey = typeof defaultFields[number];

    const fieldLabels: Record<FieldKey, string> = {
      id: 'ID',
      source: 'Источник',
      title: 'Заголовок',
      url: 'Ссылка',
      price: 'Цена',
      currency: 'Валюта',
      address: 'Адрес',
      sourceAuthorName: 'Имя продавца',
      sourceAuthorPhone: 'Телефон продавца',
      sourceAuthorUrl: 'Ссылка на продавца',
      publishedAt: 'Дата публикации',
      postedAt: 'Оригинальная дата публикации',
      parsedAt: 'Дата парсинга',
      images: 'Изображения',
      description: 'Описание',
      manualNote: 'Примечание',
    };

    const parseFields = (value?: string): FieldKey[] => {
      const raw = (value ?? '').trim();
      if (!raw) return [...defaultFields];
      const allowed = new Set(defaultFields);
      const list = raw.split(',').map((s) => s.trim()).filter(Boolean) as string[];
      const result: FieldKey[] = [];
      for (const key of list) {
        if (allowed.has(key as FieldKey)) {
          result.push(key as FieldKey);
        }
      }
      return result.length > 0 ? result : [...defaultFields];
    };

    const fields = parseFields(fieldsParam);

    const escapeCsv = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) {
        return escapeCsv(value.join('; '));
      }
      const str = typeof value === 'string' ? value : String(value);
      const needsQuotes = /[",\n\r;]/.test(str);
      const escaped = str.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const bom = '\uFEFF';
    const filenameParts = ['listings'];
    if (source) filenameParts.push(source);
    if (exportAll) filenameParts.push('all');
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().replace(/[:T]/g, '-').slice(0, 16);
    filenameParts.push(iso);
    const filename = `${filenameParts.join('_')}.csv`;

    res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res?.write(bom);
    const headerRow = fields
      .map((field) => escapeCsv(fieldLabels[field] ?? field))
      .join(',');
    res?.write(headerRow + '\n');

    const pickPublished = (item: ListingDto): string | null => {
      if (item.publishedAt) return item.publishedAt;
      if (item.sourcePostedAt) return item.sourcePostedAt;
      return item.sourceParsedAt ?? null;
    };

    for await (const batch of this.listingsService.iterateAllListings({ search, source, archived, batchSize: 1000 })) {
      for (const item of batch) {
        const row = fields.map((key) => {
          const value = ((): unknown => {
            switch (key) {
              case 'id': return item.id;
              case 'source': return item.source;
              case 'title': return item.title;
              case 'url': return item.url;
              case 'price': return item.price;
              case 'currency': return item.currency;
              case 'address': return item.address;
              case 'publishedAt': return pickPublished(item);
              case 'postedAt': {
                return item.sourcePostedAt ?? '';
              }
              case 'parsedAt': {
                return item.sourceParsedAt ?? '';
              }
              case 'images': return item.images;
              case 'description': return item.description;
              case 'sourceAuthorName': return item.sourceAuthorName;
              case 'sourceAuthorPhone': return item.sourceAuthorPhone;
              case 'sourceAuthorUrl': return item.sourceAuthorUrl;
              case 'manualNote': return item.manualNote;
              default: return '';
            }
          })();
          return escapeCsv(value);
        }).join(',');
        res?.write(row + '\n');
      }
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

  private parseBoolean(value?: string): boolean | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }

    return null;
  }
}
