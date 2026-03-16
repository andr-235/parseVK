import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { KeywordSourceFilter, ReadStatusFilter } from '../../comments/types/comments-filters.type.js';
import type { CommentsSearchViewMode } from '../comments-search.types.js';

export class CommentsSearchRequestDto {
  @IsString()
  query!: string;

  @IsString()
  @IsIn(['comments', 'posts'])
  viewMode!: CommentsSearchViewMode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['COMMENT', 'POST'])
  keywordSource?: KeywordSourceFilter;

  @IsOptional()
  @IsString()
  @IsIn(['all', 'read', 'unread'])
  readStatus?: ReadStatusFilter;
}
