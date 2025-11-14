import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, PrismaService],
  exports: [TelegramService],
})
export class TelegramModule {}

