import { Injectable } from '@nestjs/common';
import {
  AUTHORS_CONSTANTS,
  SORTABLE_FIELDS,
  DEFAULT_SORT_FIELD,
  VERIFIED_SORT_FIELD,
  DEFAULT_SORT_ORDER,
  DEFAULT_OFFSET,
  MIN_LIMIT,
} from '../authors.constants';
import type {
  AuthorSortDirection,
  AuthorSortField,
  ResolvedAuthorSort,
} from '../types/authors.types';

@Injectable()
export class AuthorsParameterNormalizer {
  normalizeOffset(value: number | null | undefined): number {
    return Math.max(value ?? DEFAULT_OFFSET, DEFAULT_OFFSET);
  }

  normalizeLimit(value: number | null | undefined): number {
    return Math.min(
      Math.max(value ?? AUTHORS_CONSTANTS.DEFAULT_LIMIT, MIN_LIMIT),
      AUTHORS_CONSTANTS.MAX_LIMIT,
    );
  }

  normalizeSearch(value: string | null | undefined): string | null | undefined {
    return value?.trim() || undefined;
  }

  normalizeSortOrder(value: AuthorSortDirection | null): AuthorSortDirection {
    return value === 'asc' || value === 'desc' ? value : DEFAULT_SORT_ORDER;
  }

  normalizeSortField(
    value: AuthorSortField | null | undefined,
  ): AuthorSortField | null {
    if (!value) {
      return null;
    }

    if (SORTABLE_FIELDS.has(value)) {
      return value;
    }

    return null;
  }

  resolveSort(
    sortBy: AuthorSortField | null | undefined,
    sortOrder: AuthorSortDirection | null,
    verified?: boolean,
  ): ResolvedAuthorSort {
    const normalizedField = this.normalizeSortField(sortBy);

    if (normalizedField) {
      return {
        field: normalizedField,
        order: this.normalizeSortOrder(sortOrder),
      };
    }

    if (verified === true) {
      return {
        field: VERIFIED_SORT_FIELD,
        order: DEFAULT_SORT_ORDER,
      };
    }

    return {
      field: DEFAULT_SORT_FIELD,
      order: DEFAULT_SORT_ORDER,
    };
  }
}
