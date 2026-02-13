import {
  IsOptional,
  IsString,
  IsInt,
  IsIn,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const SORTABLE_FIELDS = [
  'createdAt',
  'price',
  'publishedAt',
  'source',
  'address',
  'title',
  'sourceAuthorName',
  'sourceAuthorPhone',
  'sourceAuthorUrl',
  'sourceParsedAt',
] as const;

export type SortableField = (typeof SORTABLE_FIELDS)[number];

export class ListingsQueryDto {
  @Transform(({ value }: { value: unknown }) => {
    const str =
      typeof value === 'string'
        ? value
        : typeof value === 'number'
          ? String(value)
          : '';
    const parsed = Number.parseInt(str, 10);
    return Number.isFinite(parsed) ? parsed : 1;
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number;

  @Transform(({ value }: { value: unknown }) => {
    const str =
      typeof value === 'string'
        ? value
        : typeof value === 'number'
          ? String(value)
          : '';
    const parsed = Number.parseInt(str, 10);
    return Number.isFinite(parsed) ? parsed : 25;
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1' || value === 'yes')
      return true;
    if (value === false || value === 'false' || value === '0' || value === 'no')
      return false;
    return undefined;
  })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsString()
  @IsIn([...SORTABLE_FIELDS])
  sortBy?: SortableField;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
