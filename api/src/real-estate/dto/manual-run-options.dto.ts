import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ManualRunOptionsDto {
  @IsOptional()
  @IsBoolean()
  manual?: boolean;

  @IsOptional()
  @IsBoolean()
  headless?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600_000)
  manualWaitAfterMs?: number;
}
