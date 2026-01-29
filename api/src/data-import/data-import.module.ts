import { Module } from '@nestjs/common';
import { DataImportController } from './data-import.controller.js';
import { DataImportService } from './data-import.service.js';
import { ListingsModule } from '../listings/listings.module.js';

@Module({
  imports: [ListingsModule],
  controllers: [DataImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
