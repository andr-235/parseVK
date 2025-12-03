import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListingIdParamDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id!: number;
}
