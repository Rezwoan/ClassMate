import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
