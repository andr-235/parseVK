import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { validateSync, type ValidationError } from 'class-validator';
import { DataImportService } from './data-import.service.js';
import { ListingImportDto } from './dto/listing-import.dto.js';
import { ListingImportRequestDto } from './dto/listing-import-request.dto.js';
import type { ListingImportReportDto } from './dto/listing-import-report.dto.js';

const LISTING_FIELD_KEYS = new Set([
  'url',
  'source',
  'externalId',
  'title',
  'description',
  'price',
  'currency',
  'address',
  'city',
  'latitude',
  'longitude',
  'rooms',
  'areaTotal',
  'areaLiving',
  'areaKitchen',
  'floor',
  'floorsTotal',
  'publishedAt',
  'contactName',
  'contactPhone',
  'images',
  'sourceAuthorName',
  'sourceAuthorPhone',
  'sourceAuthorUrl',
  'sourcePostedAt',
  'sourceParsedAt',
  'metadata',
]);

@Controller('data')
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('import')
  async importData(@Body() body: unknown): Promise<ListingImportReportDto> {
    const requestDto = this.validateBody(body);
    return this.dataImportService.importListings(requestDto);
  }

  private validateBody(body: unknown): ListingImportRequestDto {
    const normalized = this.normalizeRequestBody(body);
    const sanitizedListings = this.sanitizeListingArray(
      (normalized as { listings: unknown }).listings,
    );
    const listingDtos = sanitizedListings.map((item) =>
      Object.assign(new ListingImportDto(), item),
    );

    const requestDto = Object.assign(
      new ListingImportRequestDto(),
      normalized,
      {
        listings: listingDtos,
      },
    );
    const requestErrors = validateSync(requestDto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (requestErrors.length > 0) {
      throw new BadRequestException({
        message: 'Неверный формат запроса импорта',
        errors: this.flattenErrors(requestErrors),
      });
    }

    const itemErrors: string[] = [];
    requestDto.listings.forEach((listingDto, index) => {
      const validationErrors = validateSync(listingDto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (validationErrors.length > 0) {
        const messages = this.flattenErrors(validationErrors);
        itemErrors.push(`Элемент ${index}: ${messages.join('; ')}`);
      }
    });

    if (itemErrors.length > 0) {
      throw new BadRequestException({
        message: 'Данные объявлений содержат ошибки',
        errors: itemErrors,
      });
    }

    return requestDto;
  }

  private normalizeRequestBody(
    body: unknown,
  ): ListingImportRequestDto | { listings: unknown } {
    if (Array.isArray(body)) {
      return { listings: body };
    }

    if (this.isPlainObject(body)) {
      if (Array.isArray(body.listings)) {
        return body as ListingImportRequestDto;
      }

      return { listings: [body] };
    }

    throw new BadRequestException({
      message: 'Неверный формат запроса импорта',
      errors: ['Ожидался массив объявлений или объект с полем listings'],
    });
  }

  private sanitizeListingArray(listings: unknown): Record<string, unknown>[] {
    if (!Array.isArray(listings)) {
      return [];
    }

    return listings.map((item) => this.sanitizeListingItem(item));
  }

  private sanitizeListingItem(item: unknown): Record<string, unknown> {
    if (!this.isPlainObject(item)) {
      return item as Record<string, unknown>;
    }

    const plainItem = item as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const extraFields: Record<string, unknown> = {};
    const existingMetadata = this.extractMetadata(plainItem.metadata);

    for (const [key, value] of Object.entries(plainItem)) {
      if (key === 'author' && typeof value === 'string') {
        const stringValue = value.trim();
        if (stringValue.length === 0) {
          continue;
        }
        if (
          typeof result.sourceAuthorName !== 'string' ||
          result.sourceAuthorName.trim().length === 0
        ) {
          result.sourceAuthorName = stringValue;
        }
        if (
          typeof result.contactName !== 'string' ||
          result.contactName.trim().length === 0
        ) {
          result.contactName = stringValue;
        }

        extraFields[key] = stringValue;
        continue;
      }

      if (key === 'author_phone' && typeof value === 'string') {
        const stringValue = value.trim();
        if (stringValue.length === 0) {
          continue;
        }
        if (
          typeof result.sourceAuthorPhone !== 'string' ||
          result.sourceAuthorPhone.trim().length === 0
        ) {
          result.sourceAuthorPhone = stringValue;
        }
        if (
          typeof result.contactPhone !== 'string' ||
          result.contactPhone.trim().length === 0
        ) {
          result.contactPhone = stringValue;
        }

        extraFields[key] = stringValue;
        continue;
      }

      if (key === 'phone' && typeof value === 'string') {
        const stringValue = value.trim();
        if (stringValue.length === 0) {
          continue;
        }
        if (
          typeof result.contactPhone !== 'string' ||
          result.contactPhone.trim().length === 0
        ) {
          result.contactPhone = stringValue;
        }

        extraFields[key] = stringValue;
        continue;
      }

      if (key === 'author_url' && typeof value === 'string') {
        const stringValue = value.trim();
        if (stringValue.length === 0) {
          continue;
        }
        if (
          typeof result.sourceAuthorUrl !== 'string' ||
          result.sourceAuthorUrl.trim().length === 0
        ) {
          result.sourceAuthorUrl = stringValue;
        }

        extraFields[key] = stringValue;
        continue;
      }

      if (
        (key === 'posted_at' || key === 'postedAt') &&
        typeof value === 'string'
      ) {
        const stringValue = value.trim();
        if (stringValue.length === 0) {
          continue;
        }
        if (
          typeof result.sourcePostedAt !== 'string' ||
          result.sourcePostedAt.trim().length === 0
        ) {
          result.sourcePostedAt = stringValue;
        }

        extraFields[key] = stringValue;
        continue;
      }

      if (
        (key === 'parsed_at' || key === 'parsedAt') &&
        typeof value === 'string'
      ) {
        const stringValue = value.trim();
        if (stringValue.length === 0) {
          continue;
        }
        if (
          typeof result.sourceParsedAt !== 'string' ||
          result.sourceParsedAt.trim().length === 0
        ) {
          const parsed = Date.parse(stringValue);
          if (!Number.isNaN(parsed)) {
            result.sourceParsedAt = stringValue;
          }
        }

        extraFields[key] = stringValue;
        continue;
      }

      if (key === 'metadata') {
        continue;
      }

      if (LISTING_FIELD_KEYS.has(key)) {
        result[key] = value;
      } else {
        extraFields[key] = value;
      }
    }

    const hasExtraFields = Object.keys(extraFields).length > 0;

    if (existingMetadata !== undefined || hasExtraFields) {
      const baseMetadata =
        existingMetadata && typeof existingMetadata === 'object'
          ? existingMetadata
          : {};

      result.metadata =
        existingMetadata === null && !hasExtraFields
          ? null
          : {
              ...baseMetadata,
              ...(hasExtraFields ? extraFields : {}),
            };
    }

    return result;
  }

  private extractMetadata(
    metadata: unknown,
  ): Record<string, unknown> | null | undefined {
    if (metadata === null) {
      return null;
    }

    if (this.isPlainObject(metadata)) {
      return { ...metadata };
    }

    return undefined;
  }

  private isPlainObject(
    value: unknown,
  ): value is Record<string, unknown> & Partial<ListingImportRequestDto> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private flattenErrors(errors: ValidationError[]): string[] {
    const result: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        result.push(...Object.values(error.constraints));
      }

      if (error.children?.length) {
        result.push(...this.flattenErrors(error.children));
      }
    }

    return result;
  }
}
