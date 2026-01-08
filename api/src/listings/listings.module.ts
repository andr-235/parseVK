import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsRepository } from './repositories/listings.repository';

@Module({
  controllers: [ListingsController],
  providers: [
    ListingsService,
    {
      provide: 'IListingsRepository',
      useClass: ListingsRepository,
    },
  ],
  exports: [ListingsService, 'IListingsRepository'],
})
export class ListingsModule {}
