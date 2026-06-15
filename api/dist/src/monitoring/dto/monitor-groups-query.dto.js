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
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MonitoringMessenger } from '../types/monitoring-messenger.enum.js';
const trimValue = ({ value }) => typeof value === 'string' ? value.trim() : value;
const normalizeMessenger = ({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
const normalizeBoolean = ({ value }) => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value !== 'string') {
        return value;
    }
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
        return false;
    }
    return value;
};
export class MonitorGroupsQueryDto {
    messenger;
    search;
    category;
    sync;
}
__decorate([
    Transform(normalizeMessenger),
    IsOptional(),
    IsEnum(MonitoringMessenger),
    __metadata("design:type", String)
], MonitorGroupsQueryDto.prototype, "messenger", void 0);
__decorate([
    Transform(trimValue),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MonitorGroupsQueryDto.prototype, "search", void 0);
__decorate([
    Transform(trimValue),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MonitorGroupsQueryDto.prototype, "category", void 0);
__decorate([
    Transform(normalizeBoolean),
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], MonitorGroupsQueryDto.prototype, "sync", void 0);
//# sourceMappingURL=monitor-groups-query.dto.js.map