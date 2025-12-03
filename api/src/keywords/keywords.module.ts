import { Module } from '@nestjs/common';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';
import { PrismaService } from '../prisma.service';
import { KeywordsRepository } from './repositories/keywords.repository';
import { KeywordsMatchesService } from './services/keywords-matches.service';

@Module({
  controllers: [KeywordsController],
  providers: [
    KeywordsService,
    KeywordsMatchesService,
    PrismaService,
    {
      provide: 'IKeywordsRepository',
      useClass: KeywordsRepository,
    },
  ],
  exports: [KeywordsService],
})
export class KeywordsModule {}
