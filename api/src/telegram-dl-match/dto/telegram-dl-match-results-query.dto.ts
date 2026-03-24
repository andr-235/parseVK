import { IsBooleanString, IsOptional } from 'class-validator';

export class TelegramDlMatchResultsQueryDto {
  @IsOptional()
  @IsBooleanString()
  strictOnly?: string;

  @IsOptional()
  @IsBooleanString()
  usernameOnly?: string;

  @IsOptional()
  @IsBooleanString()
  phoneOnly?: string;
}
