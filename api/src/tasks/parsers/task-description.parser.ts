import { Injectable } from '@nestjs/common';
import { ParsingScope } from '../dto/create-parsing-task.dto';
import type { ParsingStats } from '../interfaces/parsing-stats.interface';

export interface ParsedTaskDescription {
  scope: ParsingScope | null;
  groupIds: number[];
  postLimit: number | null;
  stats: ParsingStats | null;
  error: string | null;
  skippedGroupsMessage: string | null;
  skippedGroupIds: number[];
}

export interface PrismaTaskRecord {
  id: number;
  title: string;
  description: string | null;
  completed: boolean | null;
  totalItems?: number | null;
  processedItems?: number | null;
  progress?: number | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TaskDescriptionParser {
  parse(task: PrismaTaskRecord): ParsedTaskDescription {
    const empty = this.createEmpty();

    if (!task.description) {
      return empty;
    }

    try {
      const data = JSON.parse(task.description) as Record<string, unknown>;

      return {
        ...empty,
        scope: this.parseScope(data.scope),
        groupIds: this.parseGroupIds(data.groupIds),
        postLimit: this.parsePostLimit(data.postLimit),
        stats: this.parseStats(data.stats),
        error: typeof data.error === 'string' ? data.error : null,
        skippedGroupsMessage:
          typeof data.skippedGroupsMessage === 'string'
            ? data.skippedGroupsMessage
            : null,
        skippedGroupIds: this.parseSkippedGroupIds(
          data.skippedGroupIds,
          typeof data.skippedGroupsMessage === 'string'
            ? data.skippedGroupsMessage
            : null,
        ),
      };
    } catch {
      return empty;
    }
  }

  stringify(data: {
    scope: ParsingScope;
    groupIds: number[];
    postLimit: number;
    stats: ParsingStats | null;
    skippedGroupsMessage: string | null;
    skippedGroupIds: number[];
    current?: string | null;
  }): string {
    let payload: Record<string, unknown> = {};

    if (data.current) {
      try {
        const parsed = JSON.parse(data.current) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          payload = { ...parsed };
        }
      } catch {
        payload = {};
      }
    }

    payload.scope = data.scope;
    payload.groupIds = data.groupIds;
    payload.postLimit = data.postLimit;

    if (data.stats) {
      payload.stats = data.stats;
    } else {
      delete payload.stats;
    }

    if (data.skippedGroupsMessage) {
      payload.skippedGroupsMessage = data.skippedGroupsMessage;
    } else {
      delete payload.skippedGroupsMessage;
    }

    const uniqueSkippedIds = Array.from(new Set(data.skippedGroupIds));
    if (uniqueSkippedIds.length) {
      payload.skippedGroupIds = uniqueSkippedIds;
    } else {
      delete payload.skippedGroupIds;
    }

    if ('error' in payload) {
      delete payload.error;
    }

    return JSON.stringify(payload);
  }

  private createEmpty(): ParsedTaskDescription {
    return {
      scope: null,
      groupIds: [],
      postLimit: null,
      stats: null,
      error: null,
      skippedGroupsMessage: null,
      skippedGroupIds: [],
    };
  }

  private parseScope(value: unknown): ParsingScope | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.toLowerCase();
    if (normalized === 'all' || normalized === ParsingScope.ALL.toLowerCase()) {
      return ParsingScope.ALL;
    }
    if (
      normalized === 'selected' ||
      normalized === ParsingScope.SELECTED.toLowerCase()
    ) {
      return ParsingScope.SELECTED;
    }

    return null;
  }

  private parseGroupIds(value: unknown): number[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) =>
        typeof item === 'number'
          ? item
          : Number.isFinite(Number(item))
            ? Number(item)
            : null,
      )
      .filter((item): item is number => item !== null && !Number.isNaN(item));
  }

  private parseSkippedGroupIds(
    value: unknown,
    message: string | null,
  ): number[] {
    const parsed = this.parseGroupIds(value);
    if (parsed.length > 0) {
      return parsed;
    }

    if (!message) {
      return [];
    }

    const matches = message.match(/\d+/g);
    if (!matches) {
      return [];
    }

    return matches
      .map((token) => Number.parseInt(token, 10))
      .filter((item) => Number.isFinite(item));
  }

  private parsePostLimit(value: unknown): number | null {
    const parsed = this.parseNumericField(value);
    return parsed ?? null;
  }

  private parseStats(value: unknown): ParsingStats | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const data = value as Record<string, unknown>;
    const groups = this.parseNumericField(data.groups);
    const posts = this.parseNumericField(data.posts);
    const comments = this.parseNumericField(data.comments);
    const authors = this.parseNumericField(data.authors);

    if ([groups, posts, comments, authors].some((item) => item === null)) {
      return null;
    }

    return {
      groups: groups as number,
      posts: posts as number,
      comments: comments as number,
      authors: authors as number,
    };
  }

  private parseNumericField(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }
}
