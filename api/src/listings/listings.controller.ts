import { Controller, Get, Query, Res } from '@nestjs/common';
import { ListingsService } from './listings.service';
import type { ListingsResponseDto } from './dto/listings-response.dto';
import type { Response } from 'express';

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

  @Get('export')
  async exportListingsCsv(
    @Query('search') searchParam?: string,
    @Query('source') sourceParam?: string,
    @Query('all') allParam?: string,
    @Query('fields') fieldsParam?: string,
    @Res() res?: Response,
  ) {
    const exportAll = (allParam ?? '').toLowerCase() === '1' || (allParam ?? '').toLowerCase() === 'true';
    const search = exportAll ? undefined : this.normalizeString(searchParam) ?? undefined;
    const source = exportAll ? undefined : this.normalizeSource(sourceParam) ?? undefined;

    const defaultFields = [
      'id','source','externalId','title','url','price','currency','address','city','rooms','areaTotal','areaLiving','areaKitchen','floor','floorsTotal','latitude','longitude','contactName','contactPhone','publishedAt','createdAt','updatedAt','images','description','metadata',
    ] as const;
    type FieldKey = typeof defaultFields[number];

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
    res?.write(fields.join(',') + '\n');

    for await (const batch of this.listingsService.iterateAllListings({ search, source, batchSize: 1000 })) {
      for (const item of batch) {
        const row = fields.map((key) => {
          const value = ((): unknown => {
            switch (key) {
              case 'id': return item.id;
              case 'source': return item.source;
              case 'externalId': return item.externalId;
              case 'title': return item.title;
              case 'url': return item.url;
              case 'price': return item.price;
              case 'currency': return item.currency;
              case 'address': return item.address;
              case 'city': return item.city;
              case 'rooms': return item.rooms;
              case 'areaTotal': return item.areaTotal;
              case 'areaLiving': return item.areaLiving;
              case 'areaKitchen': return item.areaKitchen;
              case 'floor': return item.floor;
              case 'floorsTotal': return item.floorsTotal;
              case 'latitude': return item.latitude;
              case 'longitude': return item.longitude;
              case 'contactName': return item.contactName;
              case 'contactPhone': return item.contactPhone;
              case 'publishedAt': return item.publishedAt;
              case 'createdAt': return item.createdAt;
              case 'updatedAt': return item.updatedAt;
              case 'images': return item.images;
              case 'description': return item.description;
              case 'metadata': return item.metadata ? JSON.stringify(item.metadata) : '';
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
