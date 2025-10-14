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
}
