var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ArrayNotEmpty, IsArray, IsBoolean, IsOptional, ValidateNested, } from 'class-validator';
export class ListingImportRequestDto {
    listings;
    updateExisting;
}
__decorate([
    IsArray({ message: 'listings должен быть массивом' }),
    ArrayNotEmpty({ message: 'listings не может быть пустым' }),
    ValidateNested({ each: true }),
    __metadata("design:type", Array)
], ListingImportRequestDto.prototype, "listings", void 0);
__decorate([
    IsOptional(),
    IsBoolean({ message: 'updateExisting должен быть логическим значением' }),
    __metadata("design:type", Boolean)
], ListingImportRequestDto.prototype, "updateExisting", void 0);
//# sourceMappingURL=listing-import-request.dto.js.map