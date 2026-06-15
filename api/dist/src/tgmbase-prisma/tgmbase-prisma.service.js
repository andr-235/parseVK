var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TgmbasePrismaService_1;
import { Injectable, Logger, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/tgmbase/client.js';
let TgmbasePrismaService = TgmbasePrismaService_1 = class TgmbasePrismaService extends PrismaClient {
    configService;
    logger = new Logger(TgmbasePrismaService_1.name);
    constructor(configService) {
        const databaseUrl = configService.get('tgmbaseDatabaseUrl', {
            infer: true,
        });
        if (!databaseUrl) {
            throw new Error('TGMBASE_DATABASE_URL is not defined. Please set it in your environment variables.');
        }
        const adapter = new PrismaPg({ connectionString: databaseUrl });
        super({ adapter });
        this.configService = configService;
        this.logger.log('TGMBASE_DATABASE_URL настроен');
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
TgmbasePrismaService = TgmbasePrismaService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], TgmbasePrismaService);
export { TgmbasePrismaService };
//# sourceMappingURL=tgmbase-prisma.service.js.map