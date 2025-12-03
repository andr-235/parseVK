import { Module } from '@nestjs/common';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [ListingsModule],
  controllers: [DataImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
