import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncController } from './sync.controller.js';
import { SyncCron } from './sync.cron.js';
import { ClickHouseSyncProcessor } from './processors/clickhouse-sync.processor.js';
import { ElasticsearchSyncProcessor } from './processors/elasticsearch-sync.processor.js';
import { ClickHouseModule } from '../clickhouse/clickhouse.module.js';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'sync',
    }),
    ClickHouseModule,
    ElasticsearchModule,
  ],
  controllers: [SyncController],
  providers: [
    SyncCron,
    ClickHouseSyncProcessor,
    ElasticsearchSyncProcessor,
    PrismaService,
  ],
  exports: [],
})
export class SyncModule {}
