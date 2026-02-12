import { Module } from '@nestjs/common';
import { DataImportController } from './data-import.controller.js';
import { DataImportService } from './data-import.service.js';
import { ListingsModule } from '../listings/listings.module.js';
import { ListingValidatorService } from './services/listing-validator.service.js';
import { ListingNormalizerService } from './services/listing-normalizer.service.js';

@Module({
  imports: [ListingsModule],
  controllers: [DataImportController],
  providers: [
    DataImportService,
    ListingValidatorService,
    ListingNormalizerService,
  ],
})
export class DataImportModule {}
