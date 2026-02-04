import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

interface ClickHouseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface CommentAnalytics {
  id: number;
  vk_comment_id: number;
  vk_owner_id: number;
  text: string;
  post_id: number;
  author_id: number;
  author_vk_id: number;
  author_name: string;
  group_id: number | null;
  group_name: string;
  task_id: number | null;
  source: 'TASK' | 'WATCHLIST';
  created_at: string;
}

export interface AuthorStats {
  author_id: number;
  author_vk_id: number;
  author_name: string;
  total_comments: number;
  groups_count: number;
  first_seen: string;
  last_seen: string;
}

export interface TaskMetrics {
  task_id: number;
  status: 'pending' | 'running' | 'done' | 'failed';
  total_items: number;
  processed_items: number;
  progress: number;
  groups_count: number;
  posts_count: number;
  comments_count: number;
  authors_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface DailyStats {
  date: string;
  source: 'TASK' | 'WATCHLIST';
  comments_count: number;
  unique_authors: number;
  unique_groups: number;
}

export interface TopAuthor {
  author_vk_id: number;
  author_name: string;
  total_comments: number;
  last_seen: string;
}

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const config = this.configService.get<ClickHouseConfig>('clickhouse');

    if (!config) {
      throw new Error('ClickHouse configuration not found');
    }

    this.client = createClient({
      host: `http://${config.host}:${config.port}`,
      database: config.database,
      username: config.username,
      password: config.password,
    });

    await this.initializeSchema();
    this.logger.log('ClickHouse client initialized');
  }

  getClient(): ClickHouseClient {
    return this.client;
  }

  /**
   * Инициализация схемы БД - создание таблиц при старте
   */
  private async initializeSchema(): Promise<void> {
    try {
      // Таблица для аналитики комментариев
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS comments_analytics (
            id UInt64,
            vk_comment_id Int64,
            vk_owner_id Int64,
            text String,
            post_id UInt64,
            author_id UInt64,
            author_vk_id Int64,
            author_name String,
            group_id Nullable(UInt64),
            group_name Nullable(String),
            task_id Nullable(UInt64),
            source Enum8('TASK' = 1, 'WATCHLIST' = 2),
            created_at DateTime,
            date Date DEFAULT toDate(created_at)
          ) ENGINE = MergeTree()
          PARTITION BY toYYYYMM(date)
          ORDER BY (date, group_id, author_id, id)
          SETTINGS index_granularity = 8192
        `,
      });

      // Таблица для статистики авторов
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS authors_stats (
            author_id UInt64,
            author_vk_id Int64,
            author_name String,
            total_comments UInt32,
            groups_count UInt32,
            first_seen DateTime,
            last_seen DateTime,
            date Date DEFAULT toDate(last_seen)
          ) ENGINE = ReplacingMergeTree(last_seen)
          PARTITION BY toYYYYMM(date)
          ORDER BY (author_vk_id, author_id)
          SETTINGS index_granularity = 8192
        `,
      });

      // Таблица для метрик задач
      await this.client.exec({
        query: `
          CREATE TABLE IF NOT EXISTS tasks_metrics (
            task_id UInt64,
            status Enum8('pending' = 1, 'running' = 2, 'done' = 3, 'failed' = 4),
            total_items UInt32,
            processed_items UInt32,
            progress Float32,
            groups_count UInt16,
            posts_count UInt32,
            comments_count UInt32,
            authors_count UInt32,
            created_at DateTime,
            updated_at DateTime,
            completed_at Nullable(DateTime),
            date Date DEFAULT toDate(created_at)
          ) ENGINE = ReplacingMergeTree(updated_at)
          PARTITION BY toYYYYMM(date)
          ORDER BY (date, task_id)
          SETTINGS index_granularity = 8192
        `,
      });

      // Материализованное представление для дневной активности
      await this.client.exec({
        query: `
          CREATE MATERIALIZED VIEW IF NOT EXISTS daily_activity_mv
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(date)
          ORDER BY (date, source)
          AS SELECT
            toDate(created_at) as date,
            source,
            count() as comments_count,
            uniq(author_id) as unique_authors,
            uniq(group_id) as unique_groups
          FROM comments_analytics
          GROUP BY date, source
        `,
      });

      this.logger.log('ClickHouse schema initialized');
    } catch (error) {
      this.logger.error('Failed to initialize ClickHouse schema', error);
      throw error;
    }
  }

  /**
   * Вставка комментариев в аналитическую таблицу
   */
  async insertComments(comments: CommentAnalytics[]): Promise<void> {
    if (comments.length === 0) return;

    try {
      await this.client.insert({
        table: 'comments_analytics',
        values: comments,
        format: 'JSONEachRow',
      });

      this.logger.log(`Inserted ${comments.length} comments into ClickHouse`);
    } catch (error) {
      this.logger.error('Failed to insert comments', error);
      throw error;
    }
  }

  /**
   * Вставка статистики авторов
   */
  async insertAuthorStats(stats: AuthorStats[]): Promise<void> {
    if (stats.length === 0) return;

    try {
      await this.client.insert({
        table: 'authors_stats',
        values: stats,
        format: 'JSONEachRow',
      });

      this.logger.log(`Inserted ${stats.length} author stats into ClickHouse`);
    } catch (error) {
      this.logger.error('Failed to insert author stats', error);
      throw error;
    }
  }

  /**
   * Вставка метрик задач
   */
  async insertTaskMetrics(metrics: TaskMetrics[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      await this.client.insert({
        table: 'tasks_metrics',
        values: metrics,
        format: 'JSONEachRow',
      });

      this.logger.log(
        `Inserted ${metrics.length} task metrics into ClickHouse`,
      );
    } catch (error) {
      this.logger.error('Failed to insert task metrics', error);
      throw error;
    }
  }

  /**
   * Получение статистики по датам
   */
  async getDailyStats(startDate: Date, endDate: Date): Promise<DailyStats[]> {
    try {
      const result = await this.client.query({
        query: `
          SELECT
            date,
            source,
            comments_count,
            unique_authors,
            unique_groups
          FROM daily_activity_mv
          WHERE date BETWEEN {startDate:Date} AND {endDate:Date}
          ORDER BY date DESC, source
        `,
        query_params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger.error('Failed to get daily stats', error);
      throw error;
    }
  }

  /**
   * Получение топ авторов по количеству комментариев
   */
  async getTopAuthors(limit: number = 10): Promise<TopAuthor[]> {
    try {
      const result = await this.client.query({
        query: `
          SELECT
            author_vk_id,
            any(author_name) as author_name,
            sum(total_comments) as total_comments,
            max(last_seen) as last_seen
          FROM authors_stats
          GROUP BY author_vk_id
          ORDER BY total_comments DESC
          LIMIT {limit:UInt32}
        `,
        query_params: { limit },
        format: 'JSONEachRow',
      });

      return await result.json();
    } catch (error) {
      this.logger.error('Failed to get top authors', error);
      throw error;
    }
  }

  /**
   * Проверка здоровья подключения
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error('ClickHouse ping failed', error);
      return false;
    }
  }
}
