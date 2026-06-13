import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateClassSessionDto {
  @IsString()
  courseId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0 = Sunday … 6 = Saturday

  @Matches(TIME_REGEX, { message: 'startTime must be "HH:mm"' })
  startTime!: string;

  @Matches(TIME_REGEX, { message: 'endTime must be "HH:mm"' })
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  room?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;
}

export class UpdateClassSessionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'startTime must be "HH:mm"' })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'endTime must be "HH:mm"' })
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  room?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;
}
