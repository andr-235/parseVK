import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  oldPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_COMPLEXITY_REGEX)
  newPassword!: string;
}
