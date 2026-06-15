import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/app.config.js';
import { PrismaClient } from '../generated/tgmbase/client.js';
export declare class TgmbasePrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService<AppConfig>);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
