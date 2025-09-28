import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

/**
 * DTO for updating user profile information
 * Used when users update their own profile
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}

/**
 * DTO for changing user password
 * Requires current password for security
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'New password must contain at least 8 characters with uppercase, lowercase, and numbers',
  })
  newPassword: string;

  @IsString()
  @MinLength(8)
  confirmPassword: string;
}

/**
 * DTO for admin role management
 * Only admins can change user roles
 */
export class ChangeRoleDto {
  @IsEnum(Role)
  role: Role;
}

/**
 * DTO for admin user updates
 * Admins can update any user field including role and active status
 */
export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  isActive?: boolean;
}