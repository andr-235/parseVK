import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

interface ElasticsearchConfig {
  node: string;
}

export interface SearchCommentsParams {
  query: string;
  groupIds?: number[];
  authorIds?: number[];
  source?: 'TASK' | 'WATCHLIST';
  from?: number;
  size?: number;
}

export interface SearchCommentsResult {
  total: number;
  hits: CommentHit[];
  aggregations?: Record<string, unknown>;
}

interface CommentHit {
  id: number;
  text: string;
  highlights?: Record<string, string[]>;
  score?: number;
  [key: string]: unknown;
}

export interface CommentDocument {
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
  created_at: Date;
}

export interface AuthorDocument {
  id: number;
  vk_id: number;
  name: string;
  screen_name: string;
  total_comments: number;
  last_seen: Date;
}

export interface AuthorSuggestion {
  text: string;
  _source?: AuthorDocument;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const config = this.configService.get<ElasticsearchConfig>('elasticsearch');

    if (!config) {
      throw new Error('Elasticsearch configuration not found');
    }

    this.client = new Client({
      node: config.node,
    });

    await this.initializeIndices();
    this.logger.log('Elasticsearch client initialized');
  }

  getClient(): Client {
    return this.client;
  }

  /**
   * Инициализация индексов при старте
   */
  private async initializeIndices(): Promise<void> {
    try {
      // Индекс для комментариев с русской морфологией
      const commentsIndexExists = await this.client.indices.exists({
        index: 'comments',
      });

      if (!commentsIndexExists) {
        await this.client.indices.create({
          index: 'comments',
          body: {
            settings: {
              analysis: {
                analyzer: {
                  russian_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'russian_stop', 'russian_stemmer'],
                  },
                },
                filter: {
                  russian_stop: {
                    type: 'stop',
                    stopwords: '_russian_',
                  },
                  russian_stemmer: {
                    type: 'stemmer',
                    language: 'russian',
                  },
                },
              },
              number_of_shards: 1,
              number_of_replicas: 0,
            },
            mappings: {
              properties: {
                id: { type: 'long' },
                vk_comment_id: { type: 'long' },
                vk_owner_id: { type: 'long' },
                text: {
                  type: 'text',
                  analyzer: 'russian_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                post_id: { type: 'long' },
                author_id: { type: 'long' },
                author_vk_id: { type: 'long' },
                author_name: {
                  type: 'text',
                  analyzer: 'russian_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                group_id: { type: 'long' },
                group_name: {
                  type: 'text',
                  analyzer: 'russian_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                task_id: { type: 'long' },
                source: { type: 'keyword' },
                created_at: { type: 'date' },
              },
            },
          },
        });

        this.logger.log('Created comments index');
      }

      // Индекс для авторов с автодополнением
      const authorsIndexExists = await this.client.indices.exists({
        index: 'authors',
      });

      if (!authorsIndexExists) {
        await this.client.indices.create({
          index: 'authors',
          body: {
            settings: {
              analysis: {
                analyzer: {
                  russian_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'russian_stop', 'russian_stemmer'],
                  },
                },
                filter: {
                  russian_stop: {
                    type: 'stop',
                    stopwords: '_russian_',
                  },
                  russian_stemmer: {
                    type: 'stemmer',
                    language: 'russian',
                  },
                },
              },
              number_of_shards: 1,
              number_of_replicas: 0,
            },
            mappings: {
              properties: {
                id: { type: 'long' },
                vk_id: { type: 'long' },
                name: {
                  type: 'text',
                  analyzer: 'russian_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: {
                      type: 'completion',
                      analyzer: 'russian_analyzer',
                    },
                  },
                },
                screen_name: { type: 'keyword' },
                total_comments: { type: 'integer' },
                last_seen: { type: 'date' },
              },
            },
          },
        });

        this.logger.log('Created authors index');
      }

      this.logger.log('Elasticsearch indices initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch indices', error);
      throw error;
    }
  }

  /**
   * Индексация комментариев
   */
  async indexComments(comments: CommentDocument[]): Promise<void> {
    if (comments.length === 0) return;

    try {
      const body = comments.flatMap((comment) => [
        { index: { _index: 'comments', _id: comment.id } },
        comment,
      ]);

      const result = await this.client.bulk({ body });

      if (result.errors) {
        this.logger.error(
          'Bulk indexing had errors',
          JSON.stringify(result.items),
        );
      }

      this.logger.log(`Indexed ${comments.length} comments`);
    } catch (error) {
      this.logger.error('Failed to index comments', error);
      throw error;
    }
  }

  /**
   * Индексация авторов
   */
  async indexAuthors(authors: AuthorDocument[]): Promise<void> {
    if (authors.length === 0) return;

    try {
      const body = authors.flatMap((author) => [
        { index: { _index: 'authors', _id: author.id } },
        author,
      ]);

      const result = await this.client.bulk({ body });

      if (result.errors) {
        this.logger.error(
          'Bulk indexing had errors',
          JSON.stringify(result.items),
        );
      }

      this.logger.log(`Indexed ${authors.length} authors`);
    } catch (error) {
      this.logger.error('Failed to index authors', error);
      throw error;
    }
  }

  /**
   * Полнотекстовый поиск по комментариям
   */
  async searchComments(
    params: SearchCommentsParams,
  ): Promise<SearchCommentsResult> {
    try {
      const must: Record<string, unknown>[] = [
        {
          multi_match: {
            query: params.query,
            fields: ['text^2', 'author_name'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        },
      ];

      if (params.groupIds && params.groupIds.length > 0) {
        must.push({ terms: { group_id: params.groupIds } });
      }

      if (params.authorIds && params.authorIds.length > 0) {
        must.push({ terms: { author_id: params.authorIds } });
      }

      if (params.source) {
        must.push({ term: { source: params.source } });
      }

      const result = await this.client.search({
        index: 'comments',
        body: {
          from: params.from || 0,
          size: params.size || 20,
          query: {
            bool: {
              must,
            },
          },
          highlight: {
            fields: {
              text: {
                pre_tags: ['<mark>'],
                post_tags: ['</mark>'],
              },
            },
          },
          sort: [{ created_at: { order: 'desc' } }],
          aggs: {
            by_source: {
              terms: { field: 'source' },
            },
            by_group: {
              terms: { field: 'group_name.keyword', size: 10 },
            },
            by_author: {
              terms: { field: 'author_name.keyword', size: 10 },
            },
          },
        },
      });

      return {
        total:
          typeof result.hits.total === 'object'
            ? (result.hits.total.value ?? 0)
            : (result.hits.total ?? 0),
        hits: result.hits.hits.map((hit) => ({
          ...(hit._source as Record<string, unknown>),
          highlights: hit.highlight,
          score: hit._score,
        })) as CommentHit[],
        aggregations: result.aggregations as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.error('Failed to search comments', error);
      throw error;
    }
  }

  /**
   * Автодополнение для имен авторов
   */
  async suggestAuthors(
    prefix: string,
    size: number = 5,
  ): Promise<AuthorSuggestion[]> {
    try {
      const result = await this.client.search({
        index: 'authors',
        body: {
          suggest: {
            author_suggest: {
              prefix,
              completion: {
                field: 'name.suggest',
                size,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      const suggestions = result.suggest as
        | Record<string, { options: AuthorSuggestion[] }[]>
        | undefined;
      return suggestions?.author_suggest?.[0]?.options || [];
    } catch (error) {
      this.logger.error('Failed to suggest authors', error);
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
      this.logger.error('Elasticsearch ping failed', error);
      return false;
    }
  }
}
