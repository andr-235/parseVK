import { Module } from '@nestjs/common';
import { KeywordsController } from './keywords.controller.js';
import { KeywordsService } from './keywords.service.js';
import { KeywordsRepository } from './repositories/keywords.repository.js';
import { KeywordsMatchesService } from './services/keywords-matches.service.js';

@Module({
  controllers: [KeywordsController],
  providers: [
    KeywordsService,
    KeywordsMatchesService,
    {
      provide: 'IKeywordsRepository',
      useClass: KeywordsRepository,
    },
  ],
  exports: [KeywordsService],
})
export class KeywordsModule {}
