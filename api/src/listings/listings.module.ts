import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma.service';
import { ListingsRepository } from './repositories/listings.repository';

@Module({
  controllers: [ListingsController],
  providers: [
    ListingsService,
    PrismaService,
    {
      provide: 'IListingsRepository',
      useClass: ListingsRepository,
    },
  ],
  exports: [ListingsService, 'IListingsRepository'],
})
export class ListingsModule {}
