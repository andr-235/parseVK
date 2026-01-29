import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller.js';
import { ListingsService } from './listings.service.js';
import { ListingsRepository } from './repositories/listings.repository.js';

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
