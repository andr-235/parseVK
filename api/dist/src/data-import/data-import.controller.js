var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { validateSync } from 'class-validator';
import { DataImportService } from './data-import.service.js';
import { ListingImportDto } from './dto/listing-import.dto.js';
import { ListingImportRequestDto } from './dto/listing-import-request.dto.js';
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
let DataImportController = class DataImportController {
    dataImportService;
    constructor(dataImportService) {
        this.dataImportService = dataImportService;
    }
    async importData(body) {
        const requestDto = this.validateBody(body);
        return this.dataImportService.importListings(requestDto);
    }
    validateBody(body) {
        const normalized = this.normalizeRequestBody(body);
        const sanitizedListings = this.sanitizeListingArray(normalized.listings);
        const listingDtos = sanitizedListings.map((item) => Object.assign(new ListingImportDto(), item));
        const requestDto = Object.assign(new ListingImportRequestDto(), normalized, {
            listings: listingDtos,
        });
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
        const itemErrors = [];
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
    normalizeRequestBody(body) {
        if (Array.isArray(body)) {
            return { listings: body };
        }
        if (this.isPlainObject(body)) {
            if (Array.isArray(body.listings)) {
                return body;
            }
            return { listings: [body] };
        }
        throw new BadRequestException({
            message: 'Неверный формат запроса импорта',
            errors: ['Ожидался массив объявлений или объект с полем listings'],
        });
    }
    sanitizeListingArray(listings) {
        if (!Array.isArray(listings)) {
            return [];
        }
        return listings.map((item) => this.sanitizeListingItem(item));
    }
    sanitizeListingItem(item) {
        if (!this.isPlainObject(item)) {
            return item;
        }
        const plainItem = item;
        const result = {};
        const extraFields = {};
        const existingMetadata = this.extractMetadata(plainItem.metadata);
        for (const [key, value] of Object.entries(plainItem)) {
            if (key === 'author' && typeof value === 'string') {
                const stringValue = value.trim();
                if (stringValue.length === 0) {
                    continue;
                }
                if (typeof result.sourceAuthorName !== 'string' ||
                    result.sourceAuthorName.trim().length === 0) {
                    result.sourceAuthorName = stringValue;
                }
                if (typeof result.contactName !== 'string' ||
                    result.contactName.trim().length === 0) {
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
                if (typeof result.sourceAuthorPhone !== 'string' ||
                    result.sourceAuthorPhone.trim().length === 0) {
                    result.sourceAuthorPhone = stringValue;
                }
                if (typeof result.contactPhone !== 'string' ||
                    result.contactPhone.trim().length === 0) {
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
                if (typeof result.contactPhone !== 'string' ||
                    result.contactPhone.trim().length === 0) {
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
                if (typeof result.sourceAuthorUrl !== 'string' ||
                    result.sourceAuthorUrl.trim().length === 0) {
                    result.sourceAuthorUrl = stringValue;
                }
                extraFields[key] = stringValue;
                continue;
            }
            if ((key === 'posted_at' || key === 'postedAt') &&
                typeof value === 'string') {
                const stringValue = value.trim();
                if (stringValue.length === 0) {
                    continue;
                }
                if (typeof result.sourcePostedAt !== 'string' ||
                    result.sourcePostedAt.trim().length === 0) {
                    result.sourcePostedAt = stringValue;
                }
                extraFields[key] = stringValue;
                continue;
            }
            if ((key === 'parsed_at' || key === 'parsedAt') &&
                typeof value === 'string') {
                const stringValue = value.trim();
                if (stringValue.length === 0) {
                    continue;
                }
                if (typeof result.sourceParsedAt !== 'string' ||
                    result.sourceParsedAt.trim().length === 0) {
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
            }
            else {
                extraFields[key] = value;
            }
        }
        const hasExtraFields = Object.keys(extraFields).length > 0;
        if (existingMetadata !== undefined || hasExtraFields) {
            const baseMetadata = existingMetadata && typeof existingMetadata === 'object'
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
    extractMetadata(metadata) {
        if (metadata === null) {
            return null;
        }
        if (this.isPlainObject(metadata)) {
            return { ...metadata };
        }
        return undefined;
    }
    isPlainObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    flattenErrors(errors) {
        const result = [];
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
};
__decorate([
    Post('import'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataImportController.prototype, "importData", null);
DataImportController = __decorate([
    Controller('data'),
    __metadata("design:paramtypes", [DataImportService])
], DataImportController);
export { DataImportController };
//# sourceMappingURL=data-import.controller.js.map