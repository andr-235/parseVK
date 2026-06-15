var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type, Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested, } from 'class-validator';
const FRIENDS_ORDER_VALUES = [
    'hints',
    'mobile',
    'name',
    'random',
    'smart',
];
const NAME_CASE_VALUES = ['nom', 'gen', 'dat', 'acc', 'ins', 'abl'];
const normalizeStringArray = ({ value }) => {
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return value;
};
export class VkFriendsParamsDto {
    user_id;
    order;
    list_id;
    count;
    offset;
    fields;
    name_case;
    ref;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], VkFriendsParamsDto.prototype, "user_id", void 0);
__decorate([
    IsOptional(),
    IsIn(FRIENDS_ORDER_VALUES),
    __metadata("design:type", Object)
], VkFriendsParamsDto.prototype, "order", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], VkFriendsParamsDto.prototype, "list_id", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(5000),
    __metadata("design:type", Number)
], VkFriendsParamsDto.prototype, "count", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], VkFriendsParamsDto.prototype, "offset", void 0);
__decorate([
    IsOptional(),
    Transform(normalizeStringArray),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], VkFriendsParamsDto.prototype, "fields", void 0);
__decorate([
    IsOptional(),
    IsIn(NAME_CASE_VALUES),
    __metadata("design:type", Object)
], VkFriendsParamsDto.prototype, "name_case", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], VkFriendsParamsDto.prototype, "ref", void 0);
export class VkFriendsExportRequestDto {
    params;
}
__decorate([
    ValidateNested(),
    Type(() => VkFriendsParamsDto),
    __metadata("design:type", VkFriendsParamsDto)
], VkFriendsExportRequestDto.prototype, "params", void 0);
//# sourceMappingURL=vk-friends.dto.js.map