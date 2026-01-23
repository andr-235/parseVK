import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AUTHORS_CONSTANTS, SORTABLE_FIELDS } from '../authors.constants';
import type {
  AuthorSortDirection,
  AuthorSortField,
} from '../types/authors.types';

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 'all'
  ) {
    return undefined;
  }

  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }

  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }

  return undefined;
}

function toSortableField(value: unknown): AuthorSortField | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const field = value as AuthorSortField;
  return SORTABLE_FIELDS.has(field) ? field : null;
}

function toSortDirection(value: unknown): AuthorSortDirection | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return value === 'asc' || value === 'desc' ? value : null;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class ListAuthorsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AUTHORS_CONSTANTS.MAX_LIMIT)
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => toOptionalString(value))
  @IsOptional()
  @IsString()
  city?: string;

  @Transform(({ value, obj }: { value: unknown; obj: unknown }) => {
    const rawVerified =
      obj && typeof obj === 'object' && 'verified' in obj
        ? (obj as { verified?: unknown }).verified
        : value;
    return toOptionalBoolean(rawVerified);
  })
  @IsOptional()
  verified?: boolean;

  @Transform(({ value }) => toSortableField(value))
  @IsOptional()
  sortBy?: AuthorSortField | null;

  @Transform(({ value }) => toSortDirection(value))
  @IsOptional()
  sortOrder?: AuthorSortDirection | null;
}
