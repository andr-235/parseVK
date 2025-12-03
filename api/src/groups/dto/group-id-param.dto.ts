import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GroupIdParamDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id!: number;
}

