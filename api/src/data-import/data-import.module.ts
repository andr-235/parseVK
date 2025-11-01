import { Module } from '@nestjs/common';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { PrismaService } from '../prisma.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  controllers: [DataImportController],
  providers: [DataImportService, PrismaService, ApiKeyGuard],
})
export class DataImportModule {}
