var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, } from 'class-validator';
export class SyncTelegramChatDto {
    identifier;
    limit;
    enrichWithFullData;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], SyncTelegramChatDto.prototype, "identifier", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value === undefined || value === null ? undefined : Number(value)),
    IsInt(),
    Min(1),
    Max(10000),
    __metadata("design:type", Number)
], SyncTelegramChatDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value === 'true' || value === true),
    IsBoolean(),
    __metadata("design:type", Boolean)
], SyncTelegramChatDto.prototype, "enrichWithFullData", void 0);
//# sourceMappingURL=sync-telegram-chat.dto.js.map