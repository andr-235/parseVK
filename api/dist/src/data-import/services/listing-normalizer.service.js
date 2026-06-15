var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let ListingNormalizerService = class ListingNormalizerService {
    buildListingData(listing) {
        const images = Array.isArray(listing.images)
            ? listing.images.filter((image) => typeof image === 'string' && image.trim().length > 0)
            : [];
        const metadata = this.normalizeMetadata(listing.metadata);
        const sourceAuthorName = this.resolveSourceString(listing.sourceAuthorName, metadata, ['author', 'author_name', 'contact_name', 'contactName']);
        const sourceAuthorPhone = this.resolveSourceString(listing.sourceAuthorPhone, metadata, ['author_phone', 'contact_phone', 'phone']);
        const sourceAuthorUrl = this.resolveSourceString(listing.sourceAuthorUrl, metadata, ['author_url', 'url']);
        const sourcePostedAt = this.resolveSourceString(listing.sourcePostedAt, metadata, ['posted_at', 'postedAt', 'published_at', 'publishedAt']);
        const sourceParsedAt = this.resolveSourceDate(listing.sourceParsedAt, metadata, ['parsed_at', 'parsedAt']);
        return {
            url: listing.url.trim(),
            source: this.stringValue(listing.source),
            externalId: this.stringValue(listing.externalId),
            title: this.stringValue(listing.title),
            description: this.stringValue(listing.description),
            price: this.integerValue(listing.price),
            currency: this.stringValue(listing.currency),
            address: this.stringValue(listing.address),
            city: this.stringValue(listing.city),
            latitude: this.floatValue(listing.latitude),
            longitude: this.floatValue(listing.longitude),
            rooms: this.integerValue(listing.rooms),
            areaTotal: this.floatValue(listing.areaTotal),
            areaLiving: this.floatValue(listing.areaLiving),
            areaKitchen: this.floatValue(listing.areaKitchen),
            floor: this.integerValue(listing.floor),
            floorsTotal: this.integerValue(listing.floorsTotal),
            publishedAt: this.dateValue(listing.publishedAt),
            contactName: this.stringValue(listing.contactName),
            contactPhone: this.stringValue(listing.contactPhone),
            images,
            sourceAuthorName,
            sourceAuthorPhone,
            sourceAuthorUrl,
            sourcePostedAt,
            sourceParsedAt,
        };
    }
    excludeManualOverrides(data, overrides) {
        const manualFields = new Set(overrides);
        const update = { ...data };
        for (const field of manualFields) {
            if (field in update) {
                delete update[field];
            }
        }
        delete update['manualOverrides'];
        return update;
    }
    normalizeManualOverrides(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0);
    }
    normalizeMetadata(metadata) {
        if (!metadata) {
            return null;
        }
        if (Array.isArray(metadata)) {
            return null;
        }
        if (typeof metadata !== 'object') {
            return null;
        }
        return { ...metadata };
    }
    resolveSourceString(direct, metadata, keys) {
        const directValue = this.stringValue(direct);
        if (directValue !== undefined) {
            return directValue;
        }
        if (!metadata) {
            return undefined;
        }
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
                continue;
            }
            const raw = metadata[key];
            if (typeof raw === 'string' || raw === null) {
                const normalized = this.stringValue(raw);
                if (normalized !== undefined) {
                    return normalized;
                }
            }
        }
        return undefined;
    }
    resolveSourceDate(direct, metadata, keys) {
        if (direct !== undefined) {
            const parsed = this.dateValue(direct);
            if (parsed !== undefined) {
                return parsed;
            }
        }
        if (!metadata) {
            return undefined;
        }
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(metadata, key)) {
                continue;
            }
            const raw = metadata[key];
            if (typeof raw === 'string') {
                const parsed = this.dateValue(raw);
                if (parsed !== undefined) {
                    return parsed;
                }
            }
        }
        return undefined;
    }
    stringValue(value) {
        if (typeof value !== 'string') {
            return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    integerValue(value) {
        if (value === null || value === undefined) {
            return undefined;
        }
        if (typeof value === 'number') {
            return Number.isFinite(value) ? Math.round(value) : undefined;
        }
        const digitsOnly = String(value).replace(/\D/g, '');
        if (!digitsOnly) {
            return undefined;
        }
        const numeric = Number(digitsOnly);
        if (!Number.isFinite(numeric)) {
            return undefined;
        }
        return Math.round(numeric);
    }
    floatValue(value) {
        if (value === null || value === undefined) {
            return undefined;
        }
        const numeric = typeof value === 'number'
            ? value
            : Number(String(value).replace(/\s+/g, '').replace(',', '.'));
        return Number.isFinite(numeric) ? numeric : undefined;
    }
    dateValue(value) {
        if (!value) {
            return undefined;
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date;
    }
};
ListingNormalizerService = __decorate([
    Injectable()
], ListingNormalizerService);
export { ListingNormalizerService };
//# sourceMappingURL=listing-normalizer.service.js.map