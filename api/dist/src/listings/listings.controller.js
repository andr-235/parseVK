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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query, Res, } from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import { ListingsQueryDto } from './dto/listings-query.dto.js';
import { ListingIdParamDto } from './dto/listing-id-param.dto.js';
import { buildCsvFilename, parseCsvFields } from './utils/csv-exporter.js';
let ListingsController = class ListingsController {
    listingsService;
    constructor(listingsService) {
        this.listingsService = listingsService;
    }
    async getListings(query) {
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
    async exportListingsCsv(searchParam, sourceParam, archivedParam, allParam, fieldsParam, res) {
        const exportAll = (allParam ?? '').toLowerCase() === '1' ||
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
    async updateListing(params, payload) {
        return this.listingsService.updateListing(params.id, payload);
    }
    async deleteListing(params) {
        return this.listingsService.deleteListing(params.id);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListingsQueryDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "getListings", null);
__decorate([
    Get('export'),
    __param(0, Query('search')),
    __param(1, Query('source')),
    __param(2, Query('archived')),
    __param(3, Query('all')),
    __param(4, Query('fields')),
    __param(5, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "exportListingsCsv", null);
__decorate([
    Patch(':id'),
    __param(0, Param()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListingIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "updateListing", null);
__decorate([
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListingIdParamDto]),
    __metadata("design:returntype", Promise)
], ListingsController.prototype, "deleteListing", null);
ListingsController = __decorate([
    Controller('listings'),
    __metadata("design:paramtypes", [ListingsService])
], ListingsController);
export { ListingsController };
function normalizeString(value) {
    if (!value)
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function normalizeSource(value) {
    const normalized = normalizeString(value);
    if (!normalized)
        return null;
    if (normalized.toLowerCase() === 'all')
        return null;
    return normalized;
}
function parseBoolean(value) {
    if (!value)
        return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes')
        return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no')
        return false;
    return null;
}
//# sourceMappingURL=listings.controller.js.map