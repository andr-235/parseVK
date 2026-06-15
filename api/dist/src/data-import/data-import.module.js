var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { DataImportController } from './data-import.controller.js';
import { DataImportService } from './data-import.service.js';
import { ListingsModule } from '../listings/listings.module.js';
import { ListingValidatorService } from './services/listing-validator.service.js';
import { ListingNormalizerService } from './services/listing-normalizer.service.js';
let DataImportModule = class DataImportModule {
};
DataImportModule = __decorate([
    Module({
        imports: [ListingsModule],
        controllers: [DataImportController],
        providers: [
            DataImportService,
            ListingValidatorService,
            ListingNormalizerService,
        ],
    })
], DataImportModule);
export { DataImportModule };
//# sourceMappingURL=data-import.module.js.map