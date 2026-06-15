var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AUTHORS_CONSTANTS, SORTABLE_FIELDS } from '../authors.constants.js';
function toOptionalBoolean(value) {
    if (value === undefined ||
        value === null ||
        value === '' ||
        value === 'all') {
        return undefined;
    }
    if (value === true || value === 'true' || value === 1 || value === '1') {
        return true;
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
        return false;
    }
    return undefined;
}
function toSortableField(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }
    const field = value;
    return SORTABLE_FIELDS.has(field) ? field : null;
}
function toSortDirection(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }
    return value === 'asc' || value === 'desc' ? value : null;
}
function toOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
export class ListAuthorsQueryDto {
    offset;
    limit;
    search;
    city;
    verified;
    sortBy;
    sortOrder;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(0),
    IsOptional(),
    __metadata("design:type", Number)
], ListAuthorsQueryDto.prototype, "offset", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(AUTHORS_CONSTANTS.MAX_LIMIT),
    IsOptional(),
    __metadata("design:type", Number)
], ListAuthorsQueryDto.prototype, "limit", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], ListAuthorsQueryDto.prototype, "search", void 0);
__decorate([
    Transform(({ value }) => toOptionalString(value)),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ListAuthorsQueryDto.prototype, "city", void 0);
__decorate([
    Transform(({ value, obj }) => {
        const rawVerified = obj && typeof obj === 'object' && 'verified' in obj
            ? obj.verified
            : value;
        return toOptionalBoolean(rawVerified);
    }),
    IsOptional(),
    __metadata("design:type", Boolean)
], ListAuthorsQueryDto.prototype, "verified", void 0);
__decorate([
    Transform(({ value }) => toSortableField(value)),
    IsOptional(),
    __metadata("design:type", Object)
], ListAuthorsQueryDto.prototype, "sortBy", void 0);
__decorate([
    Transform(({ value }) => toSortDirection(value)),
    IsOptional(),
    __metadata("design:type", Object)
], ListAuthorsQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=list-authors-query.dto.js.map