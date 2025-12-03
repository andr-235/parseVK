import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class KeywordIdParamDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id!: number;
}

