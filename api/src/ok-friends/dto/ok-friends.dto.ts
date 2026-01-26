import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export interface FriendFlatDto {
  id: string | null;
}

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
