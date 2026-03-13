import { Global, Module } from '@nestjs/common';
import { TgmbasePrismaService } from './tgmbase-prisma.service.js';

@Global()
@Module({
  providers: [TgmbasePrismaService],
  exports: [TgmbasePrismaService],
})
export class TgmbasePrismaModule {}
