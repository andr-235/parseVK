import { IsOptional, IsString } from 'class-validator';

export class UpdateKeywordCategoryDto {
  @IsOptional()
  @IsString()
  category?: string | null;
}
