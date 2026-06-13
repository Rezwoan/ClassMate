import {
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
  @IsOptional()
  @IsString()
  semesterId?: string; // defaults to the active semester

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  credits?: number;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  credits?: number;
}
