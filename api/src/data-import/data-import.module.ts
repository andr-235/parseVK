import { Module } from '@nestjs/common';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DataImportController],
  providers: [DataImportService, PrismaService],
})
export class DataImportModule {}
