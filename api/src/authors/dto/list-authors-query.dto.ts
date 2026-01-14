import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { AUTHORS_CONSTANTS, SORTABLE_FIELDS } from '../authors.constants';
import type {
  AuthorSortField,
  AuthorSortDirection,
} from '../types/authors.types';

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

  @Transform(({ value }) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'all'
    ) {
      return undefined;
    }
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return undefined;
  })
  @IsOptional()
  verified?: boolean;

  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const field = value as AuthorSortField;
    return SORTABLE_FIELDS.has(field) ? field : null;
  })
  @IsOptional()
  sortBy?: AuthorSortField | null;

  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') {
      return null;
    }
    return value === 'asc' || value === 'desc' ? value : null;
  })
  @IsOptional()
  sortOrder?: AuthorSortDirection | null;
}
