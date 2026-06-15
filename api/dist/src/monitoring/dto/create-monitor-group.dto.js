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
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MonitoringMessenger } from '../types/monitoring-messenger.enum.js';
const trimValue = ({ value }) => typeof value === 'string' ? value.trim() : value;
const normalizeMessenger = ({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
export class CreateMonitorGroupDto {
    chatId;
    name;
    category;
    messenger;
}
__decorate([
    Transform(trimValue),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateMonitorGroupDto.prototype, "chatId", void 0);
__decorate([
    Transform(trimValue),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateMonitorGroupDto.prototype, "name", void 0);
__decorate([
    Transform(trimValue),
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], CreateMonitorGroupDto.prototype, "category", void 0);
__decorate([
    Transform(normalizeMessenger),
    IsEnum(MonitoringMessenger),
    __metadata("design:type", String)
], CreateMonitorGroupDto.prototype, "messenger", void 0);
//# sourceMappingURL=create-monitor-group.dto.js.map