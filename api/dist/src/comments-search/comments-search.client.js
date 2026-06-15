export class CommentsSearchClient {
    config;
    indexName;
    constructor(config) {
        this.config = config;
        this.indexName = config.indexName;
    }
    async search(payload) {
        return this.request('_search', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
    async indexDocument(id, document) {
        await this.request(`_doc/${encodeURIComponent(id)}?refresh=wait_for`, {
            method: 'PUT',
            body: JSON.stringify(document),
        });
    }
    async request(path, init) {
        const response = await fetch(`${this.config.node}/${encodeURIComponent(this.indexName)}/${path}`, {
            ...init,
            headers: {
                'content-type': 'application/json',
                ...this.buildAuthHeaders(),
                ...(init.headers ?? {}),
            },
        });
        if (!response.ok) {
            throw new Error(`Comments search request failed with status ${response.status}`);
        }
        if (response.status === 204) {
            return undefined;
        }
        return (await response.json());
    }
    buildAuthHeaders() {
        if (!this.config.username || !this.config.password) {
            return undefined;
        }
        const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
        return {
            authorization: `Basic ${credentials}`,
        };
    }
}
//# sourceMappingURL=comments-search.client.js.map