import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export enum ParsingScope {
  ALL = 'all',
  SELECTED = 'selected',
}

export enum ParsingTaskMode {
  RECENT_POSTS = 'recent_posts',
  RECHECK_GROUP = 'recheck_group',
}

export class CreateParsingTaskDto {
  @IsOptional()
  @IsEnum(ParsingScope)
  scope?: ParsingScope;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  groupIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  postLimit?: number;

  @IsOptional()
  @IsEnum(ParsingTaskMode)
  mode?: ParsingTaskMode;
}
