import { IsNotEmpty, IsString } from 'class-validator';

export class KeywordFormDto {
  @IsNotEmpty()
  @IsString()
  form!: string;
}
