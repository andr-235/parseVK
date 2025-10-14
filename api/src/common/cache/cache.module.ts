import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from './cache.config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfigService,
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
