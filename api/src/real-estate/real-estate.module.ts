import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RealEstateRepository } from './real-estate.repository';
import { RealEstateScraperService } from './real-estate.scraper.service';
import { RealEstateSchedulerService } from './real-estate-scheduler.service';
import { RealEstateController } from './real-estate.controller';

@Module({
  controllers: [RealEstateController],
  providers: [
    RealEstateScraperService,
    RealEstateSchedulerService,
    RealEstateRepository,
    PrismaService,
  ],
  exports: [RealEstateScraperService, RealEstateSchedulerService],
})
export class RealEstateModule {}
