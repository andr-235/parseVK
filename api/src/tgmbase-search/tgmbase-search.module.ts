import { Module } from '@nestjs/common';
import { TgmbaseSearchController } from './tgmbase-search.controller.js';
import { TgmbaseSearchGateway } from './tgmbase-search.gateway.js';
import { TgmbaseSearchMapper } from './mappers/tgmbase-search.mapper.js';
import { TgmbaseSearchService } from './tgmbase-search.service.js';

@Module({
  controllers: [TgmbaseSearchController],
  providers: [TgmbaseSearchService, TgmbaseSearchMapper, TgmbaseSearchGateway],
  exports: [TgmbaseSearchService],
})
export class TgmbaseSearchModule {}
