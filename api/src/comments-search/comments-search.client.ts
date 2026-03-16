import type { CommentsSearchConfig } from './comments-search.types.js';

export class CommentsSearchClient {
  readonly indexName: string;

  constructor(private readonly config: CommentsSearchConfig) {
    this.indexName = config.indexName;
  }

  async search<TResponse>(payload: unknown): Promise<TResponse> {
    return this.request<TResponse>('_search', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async indexDocument(id: string, document: unknown): Promise<void> {
    await this.request(`_doc/${encodeURIComponent(id)}?refresh=wait_for`, {
      method: 'PUT',
      body: JSON.stringify(document),
    });
  }

  private async request<TResponse>(
    path: string,
    init: RequestInit,
  ): Promise<TResponse> {
    const response = await fetch(
      `${this.config.node}/${encodeURIComponent(this.indexName)}/${path}`,
      {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...this.buildAuthHeaders(),
          ...(init.headers ?? {}),
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Comments search request failed with status ${response.status}`,
      );
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }

  private buildAuthHeaders(): HeadersInit | undefined {
    if (!this.config.username || !this.config.password) {
      return undefined;
    }

    const credentials = Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString('base64');

    return {
      authorization: `Basic ${credentials}`,
    };
  }
}
