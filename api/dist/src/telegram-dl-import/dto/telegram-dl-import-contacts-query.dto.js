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
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, } from 'class-validator';
export const DEFAULT_DL_CONTACTS_LIMIT = 100;
export const MAX_DL_CONTACTS_LIMIT = 500;
export class TelegramDlImportContactsQueryDto {
    fileName;
    telegramId;
    username;
    phone;
    activeOnly;
    limit = DEFAULT_DL_CONTACTS_LIMIT;
    offset = 0;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TelegramDlImportContactsQueryDto.prototype, "fileName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TelegramDlImportContactsQueryDto.prototype, "telegramId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TelegramDlImportContactsQueryDto.prototype, "username", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TelegramDlImportContactsQueryDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    Type(() => Boolean),
    IsBoolean(),
    __metadata("design:type", Boolean)
], TelegramDlImportContactsQueryDto.prototype, "activeOnly", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(MAX_DL_CONTACTS_LIMIT),
    __metadata("design:type", Number)
], TelegramDlImportContactsQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], TelegramDlImportContactsQueryDto.prototype, "offset", void 0);
//# sourceMappingURL=telegram-dl-import-contacts-query.dto.js.map