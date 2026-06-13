import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  fullName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  instituteName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  studentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}

export class ResendOtpDto {
  @IsEmail()
  email!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
