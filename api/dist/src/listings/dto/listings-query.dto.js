var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsOptional, IsString, IsInt, IsIn, Min, Max, IsBoolean, } from 'class-validator';
import { Transform, Type } from 'class-transformer';
const SORTABLE_FIELDS = [
    'createdAt',
    'price',
    'publishedAt',
    'source',
    'address',
    'title',
    'sourceAuthorName',
    'contactPhone',
    'sourceAuthorUrl',
    'sourceParsedAt',
];
export class ListingsQueryDto {
    page;
    pageSize;
    search;
    source;
    archived;
    sortBy;
    sortOrder;
}
__decorate([
    Transform(({ value }) => {
        const str = typeof value === 'string'
            ? value
            : typeof value === 'number'
                ? String(value)
                : '';
        const parsed = Number.parseInt(str, 10);
        return Number.isFinite(parsed) ? parsed : 1;
    }),
    Type(() => Number),
    IsOptional(),
    IsInt(),
    Min(1),
    Max(1000),
    __metadata("design:type", Number)
], ListingsQueryDto.prototype, "page", void 0);
__decorate([
    Transform(({ value }) => {
        const str = typeof value === 'string'
            ? value
            : typeof value === 'number'
                ? String(value)
                : '';
        const parsed = Number.parseInt(str, 10);
        return Number.isFinite(parsed) ? parsed : 25;
    }),
    Type(() => Number),
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], ListingsQueryDto.prototype, "pageSize", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ListingsQueryDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ListingsQueryDto.prototype, "source", void 0);
__decorate([
    Transform(({ value }) => {
        if (value === true || value === 'true' || value === '1' || value === 'yes')
            return true;
        if (value === false || value === 'false' || value === '0' || value === 'no')
            return false;
        return undefined;
    }),
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ListingsQueryDto.prototype, "archived", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn([...SORTABLE_FIELDS]),
    __metadata("design:type", String)
], ListingsQueryDto.prototype, "sortBy", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['asc', 'desc']),
    __metadata("design:type", String)
], ListingsQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=listings-query.dto.js.map