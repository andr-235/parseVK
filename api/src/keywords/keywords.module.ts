import { Module } from '@nestjs/common';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [KeywordsController],
  providers: [KeywordsService, PrismaService],
  exports: [KeywordsService],
})
export class KeywordsModule {}
