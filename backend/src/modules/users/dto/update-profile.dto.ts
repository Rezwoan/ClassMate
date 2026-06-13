import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  instituteName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  studentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
