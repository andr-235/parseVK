import { IsBoolean, IsInt, Max, Min } from 'class-validator'

export class UpdateTaskAutomationSettingsDto {
  @IsBoolean()
  enabled!: boolean

  @IsInt()
  @Min(0)
  @Max(23)
  runHour!: number

  @IsInt()
  @Min(0)
  @Max(59)
  runMinute!: number

  @IsInt()
  @Min(1)
  @Max(100)
  postLimit!: number
}
