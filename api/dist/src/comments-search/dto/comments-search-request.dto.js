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
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, } from 'class-validator';
export class CommentsSearchRequestDto {
    query;
    viewMode;
    page = 1;
    pageSize = 20;
    keywords;
    keywordSource;
    readStatus;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CommentsSearchRequestDto.prototype, "query", void 0);
__decorate([
    IsString(),
    IsIn(['comments', 'posts']),
    __metadata("design:type", String)
], CommentsSearchRequestDto.prototype, "viewMode", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CommentsSearchRequestDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], CommentsSearchRequestDto.prototype, "pageSize", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CommentsSearchRequestDto.prototype, "keywords", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['COMMENT', 'POST']),
    __metadata("design:type", String)
], CommentsSearchRequestDto.prototype, "keywordSource", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsIn(['all', 'read', 'unread']),
    __metadata("design:type", String)
], CommentsSearchRequestDto.prototype, "readStatus", void 0);
//# sourceMappingURL=comments-search-request.dto.js.map