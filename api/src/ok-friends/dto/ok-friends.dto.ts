import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Плоская структура данных пользователя для экспорта в XLSX
 * Все вложенные объекты расплющены с префиксами (например, location_city, location_country)
 * Массивы сохранены как JSON строки
 */
export type FriendFlatDto = Record<string, string | number | boolean | null>;

export class OkFriendsParamsDto {
  @IsOptional()
  @IsString()
  fid?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number;
}

export class OkFriendsExportRequestDto {
  @ValidateNested()
  @Type(() => OkFriendsParamsDto)
  params!: OkFriendsParamsDto;
}
