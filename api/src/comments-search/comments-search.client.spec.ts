import { describe, expect, it } from 'vitest';
import { buildCommentsSearchConfig } from './comments-search.config.js';
import { CommentsSearchClient } from './comments-search.client.js';

describe('CommentsSearchClient', () => {
  it('builds config and exposes client methods', () => {
    const config = buildCommentsSearchConfig({
      elasticsearchNode: 'http://localhost:9200',
      elasticsearchIndex: 'vk-comments',
      commentsSearchEnabled: true,
    });
    const client = new CommentsSearchClient(config);

    expect(config).toEqual({
      enabled: true,
      node: 'http://localhost:9200',
      indexName: 'vk-comments',
      username: undefined,
      password: undefined,
    });
    expect(client.indexName).toBe('vk-comments');
    expect(typeof client.search).toBe('function');
    expect(typeof client.indexDocument).toBe('function');
  });
});
