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
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength, } from 'class-validator';
import { UserRole } from '../types/user-role.enum.js';
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$/;
export class CreateUserDto {
    username;
    password;
    role;
}
__decorate([
    Transform(({ value }) => typeof value === 'string' ? value.trim() : value),
    IsString(),
    MinLength(3),
    MaxLength(64),
    Matches(/^[a-zA-Z0-9._-]+$/),
    __metadata("design:type", String)
], CreateUserDto.prototype, "username", void 0);
__decorate([
    IsString(),
    MinLength(8),
    MaxLength(128),
    Matches(PASSWORD_COMPLEXITY_REGEX),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    IsOptional(),
    IsEnum(UserRole),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
//# sourceMappingURL=create-user.dto.js.map