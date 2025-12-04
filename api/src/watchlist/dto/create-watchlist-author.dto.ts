import { IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

export class CreateWatchlistAuthorDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  commentId?: number;

  @ValidateIf(
    (object: CreateWatchlistAuthorDto): object is CreateWatchlistAuthorDto =>
      typeof object.commentId === 'undefined',
  )
  @IsInt()
  @Min(1)
  authorVkId?: number;
}
