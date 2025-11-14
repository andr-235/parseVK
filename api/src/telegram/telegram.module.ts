import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma.service';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramAuthController } from './telegram-auth.controller';

@Module({
  controllers: [TelegramController, TelegramAuthController],
  providers: [TelegramService, TelegramAuthService, PrismaService],
  exports: [TelegramService, TelegramAuthService],
})
export class TelegramModule {}

