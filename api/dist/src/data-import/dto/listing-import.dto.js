var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsArray, IsDateString, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, } from 'class-validator';
import { IsStringOrNumber } from './validators/is-string-or-number.decorator.js';
export class ListingImportDto {
    url;
    source;
    externalId;
    title;
    description;
    price;
    currency;
    address;
    city;
    latitude;
    longitude;
    rooms;
    areaTotal;
    areaLiving;
    areaKitchen;
    floor;
    floorsTotal;
    publishedAt;
    contactName;
    contactPhone;
    images;
    sourceAuthorName;
    sourceAuthorPhone;
    sourceAuthorUrl;
    sourcePostedAt;
    sourceParsedAt;
    metadata;
}
__decorate([
    IsUrl({}, { message: 'url должен быть валидным URL' }),
    IsNotEmpty({ message: 'url обязателен' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "url", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'source должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "source", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'externalId должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "externalId", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'title должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'description должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'price должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "price", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'currency должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "currency", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'address должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'city должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "city", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'latitude должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "latitude", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'longitude должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "longitude", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'rooms должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "rooms", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'areaTotal должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "areaTotal", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'areaLiving должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "areaLiving", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'areaKitchen должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "areaKitchen", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'floor должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "floor", void 0);
__decorate([
    IsOptional(),
    IsStringOrNumber({ message: 'floorsTotal должен быть строкой или числом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "floorsTotal", void 0);
__decorate([
    IsOptional(),
    IsDateString({}, { message: 'publishedAt должен быть датой в формате ISO' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "publishedAt", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'contactName должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "contactName", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'contactPhone должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "contactPhone", void 0);
__decorate([
    IsOptional(),
    IsArray({ message: 'images должен быть массивом строк' }),
    IsString({
        each: true,
        message: 'каждый элемент images должен быть строкой',
    }),
    __metadata("design:type", Array)
], ListingImportDto.prototype, "images", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'sourceAuthorName должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "sourceAuthorName", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'sourceAuthorPhone должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "sourceAuthorPhone", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'sourceAuthorUrl должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "sourceAuthorUrl", void 0);
__decorate([
    IsOptional(),
    IsString({ message: 'sourcePostedAt должен быть строкой' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "sourcePostedAt", void 0);
__decorate([
    IsOptional(),
    IsDateString({}, { message: 'sourceParsedAt должен быть датой в формате ISO' }),
    __metadata("design:type", String)
], ListingImportDto.prototype, "sourceParsedAt", void 0);
__decorate([
    IsOptional(),
    IsObject({ message: 'metadata должен быть объектом' }),
    __metadata("design:type", Object)
], ListingImportDto.prototype, "metadata", void 0);
//# sourceMappingURL=listing-import.dto.js.map