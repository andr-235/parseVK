import { Type, Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { AUTHORS_CONSTANTS } from '../authors.constants';

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
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  })
  @IsOptional()
  verified?: boolean;

  @IsString()
  @IsIn([
    'fullName',
    'photosCount',
    'audiosCount',
    'videosCount',
    'friendsCount',
    'followersCount',
    'lastSeenAt',
    'verifiedAt',
    'updatedAt',
  ])
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string;
}

