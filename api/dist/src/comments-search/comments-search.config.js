const DEFAULT_ELASTICSEARCH_NODE = 'http://localhost:9200';
const DEFAULT_ELASTICSEARCH_INDEX = 'vk-comments';
function parseBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (!value) {
        return false;
    }
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}
export function buildCommentsSearchConfig(config) {
    return {
        enabled: parseBoolean(config.commentsSearchEnabled),
        node: config.elasticsearchNode || DEFAULT_ELASTICSEARCH_NODE,
        indexName: config.elasticsearchIndex || DEFAULT_ELASTICSEARCH_INDEX,
        username: config.elasticsearchUsername || undefined,
        password: config.elasticsearchPassword || undefined,
    };
}
//# sourceMappingURL=comments-search.config.js.map