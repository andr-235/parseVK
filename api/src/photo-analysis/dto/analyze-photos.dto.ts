import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AnalyzePhotosDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
