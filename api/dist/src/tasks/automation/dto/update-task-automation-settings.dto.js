var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsInt, Max, Min } from 'class-validator';
export class UpdateTaskAutomationSettingsDto {
    enabled;
    runHour;
    runMinute;
    postLimit;
    timezoneOffsetMinutes;
}
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateTaskAutomationSettingsDto.prototype, "enabled", void 0);
__decorate([
    IsInt(),
    Min(0),
    Max(23),
    __metadata("design:type", Number)
], UpdateTaskAutomationSettingsDto.prototype, "runHour", void 0);
__decorate([
    IsInt(),
    Min(0),
    Max(59),
    __metadata("design:type", Number)
], UpdateTaskAutomationSettingsDto.prototype, "runMinute", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], UpdateTaskAutomationSettingsDto.prototype, "postLimit", void 0);
__decorate([
    IsInt(),
    Min(-720),
    Max(840),
    __metadata("design:type", Number)
], UpdateTaskAutomationSettingsDto.prototype, "timezoneOffsetMinutes", void 0);
//# sourceMappingURL=update-task-automation-settings.dto.js.map