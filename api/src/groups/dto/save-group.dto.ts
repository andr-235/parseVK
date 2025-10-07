import { IsNotEmpty, IsString } from 'class-validator';

export class SaveGroupDto {
  @IsNotEmpty()
  @IsString()
  identifier: string;
}
