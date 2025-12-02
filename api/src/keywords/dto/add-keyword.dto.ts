import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddKeywordDto {
  @IsNotEmpty()
  @IsString()
  word: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isPhrase?: boolean;
}
