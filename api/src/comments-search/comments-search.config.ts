import type { AppConfig } from '../config/app.config.js';
import type { CommentsSearchConfig } from './comments-search.types.js';

const DEFAULT_ELASTICSEARCH_NODE = 'http://localhost:9200';
const DEFAULT_ELASTICSEARCH_INDEX = 'vk-comments';

function parseBoolean(value: boolean | string | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function buildCommentsSearchConfig(
  config: Partial<AppConfig>,
): CommentsSearchConfig {
  return {
    enabled: parseBoolean(config.commentsSearchEnabled),
    node: config.elasticsearchNode || DEFAULT_ELASTICSEARCH_NODE,
    indexName: config.elasticsearchIndex || DEFAULT_ELASTICSEARCH_INDEX,
    username: config.elasticsearchUsername || undefined,
    password: config.elasticsearchPassword || undefined,
  };
}
