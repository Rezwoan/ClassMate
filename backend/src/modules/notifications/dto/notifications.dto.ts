import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class PushKeysDto {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

export class SubscribeDto {
  @IsString()
  endpoint!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;

  @IsOptional()
  expirationTime?: number | null;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class UnsubscribeDto {
  @IsString()
  endpoint!: string;
}

export class UpdatePreferenceDto {
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() classReminderEnabled?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(180) classReminderMinutesBefore?: number;
  @IsOptional() @IsBoolean() quizWeekendReminder?: boolean;
  @IsOptional() @IsBoolean() quizDayBeforeReminder?: boolean;
  @IsOptional() @IsBoolean() homeworkReminderEnabled?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(14) homeworkReminderDaysBefore?: number;
  @IsOptional() @IsBoolean() emailForClasses?: boolean;
  @IsOptional() @IsBoolean() emailForQuizzes?: boolean;
  @IsOptional() @IsBoolean() emailForHomework?: boolean;
  @IsOptional() @IsBoolean() emailForGeneral?: boolean;
}
