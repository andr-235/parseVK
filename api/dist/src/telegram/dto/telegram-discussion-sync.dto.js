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
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min, } from 'class-validator';
export class TelegramDiscussionSyncDto {
    identifier;
    mode;
    messageId;
    dateFrom;
    dateTo;
    messageLimit;
    authorLimit;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], TelegramDiscussionSyncDto.prototype, "identifier", void 0);
__decorate([
    IsIn(['thread', 'chatRange']),
    __metadata("design:type", String)
], TelegramDiscussionSyncDto.prototype, "mode", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value === undefined || value === null ? undefined : Number(value)),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], TelegramDiscussionSyncDto.prototype, "messageId", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], TelegramDiscussionSyncDto.prototype, "dateFrom", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], TelegramDiscussionSyncDto.prototype, "dateTo", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value === undefined || value === null ? undefined : Number(value)),
    IsInt(),
    Min(1),
    Max(10000),
    __metadata("design:type", Number)
], TelegramDiscussionSyncDto.prototype, "messageLimit", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value === undefined || value === null ? undefined : Number(value)),
    IsInt(),
    Min(1),
    Max(10000),
    __metadata("design:type", Number)
], TelegramDiscussionSyncDto.prototype, "authorLimit", void 0);
//# sourceMappingURL=telegram-discussion-sync.dto.js.map