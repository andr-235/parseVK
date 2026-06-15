var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Max, Min, } from 'class-validator';
export class TgmbaseSearchRequestDto {
    queries;
    searchId;
    page = 1;
    pageSize = 20;
}
__decorate([
    IsArray(),
    ArrayMinSize(1),
    IsString({ each: true }),
    __metadata("design:type", Array)
], TgmbaseSearchRequestDto.prototype, "queries", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TgmbaseSearchRequestDto.prototype, "searchId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], TgmbaseSearchRequestDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], TgmbaseSearchRequestDto.prototype, "pageSize", void 0);
//# sourceMappingURL=tgmbase-search-request.dto.js.map