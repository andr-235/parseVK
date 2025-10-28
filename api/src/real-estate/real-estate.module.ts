import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RealEstateRepository } from './real-estate.repository';
import { RealEstateScraperService } from './real-estate.scraper.service';

@Module({
  providers: [RealEstateScraperService, RealEstateRepository, PrismaService],
  exports: [RealEstateScraperService],
})
export class RealEstateModule {}
