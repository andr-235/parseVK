import { IsNotEmpty, IsString } from 'class-validator';

export class AddKeywordDto {
  @IsNotEmpty()
  @IsString()
  word: string;
}
