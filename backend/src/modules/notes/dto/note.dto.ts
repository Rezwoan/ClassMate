import {
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  courseId!: string;

  @IsOptional()
  @IsString()
  classSessionId?: string;

  /** Specific class-occurrence date (ISO date or datetime); stored at UTC midnight. */
  @IsOptional()
  @IsISO8601()
  date?: string;

  // Optional so image-only notes can be saved without a title.
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  classSessionId?: string | null;

  @IsOptional()
  @IsISO8601()
  date?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;
}
