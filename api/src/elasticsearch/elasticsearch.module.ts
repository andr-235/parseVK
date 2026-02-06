import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service.js';
import elasticsearchConfig from './elasticsearch.config.js';

@Module({
  imports: [ConfigModule.forFeature(elasticsearchConfig)],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
