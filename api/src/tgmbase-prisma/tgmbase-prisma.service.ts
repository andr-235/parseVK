import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AppConfig } from '../config/app.config.js';
import { PrismaClient } from '../generated/tgmbase/client.js';

@Injectable()
export class TgmbasePrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TgmbasePrismaService.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const databaseUrl = configService.get('tgmbaseDatabaseUrl', { infer: true });

    if (!databaseUrl) {
      throw new Error(
        'TGMBASE_DATABASE_URL is not defined. Please set it in your environment variables.',
      );
    }

    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter });

    this.logger.log('TGMBASE_DATABASE_URL настроен');
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
