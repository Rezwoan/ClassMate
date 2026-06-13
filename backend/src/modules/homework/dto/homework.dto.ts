import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const HOMEWORK_STATUSES = ['pending', 'submitted', 'late'] as const;
export type HomeworkStatus = (typeof HOMEWORK_STATUSES)[number];

export class CreateHomeworkDto {
  @IsString()
  courseId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsISO8601()
  dueDate!: string;

  @IsOptional()
  @IsIn(HOMEWORK_STATUSES)
  status?: HomeworkStatus;
}

export class UpdateHomeworkDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsIn(HOMEWORK_STATUSES)
  status?: HomeworkStatus;
}
