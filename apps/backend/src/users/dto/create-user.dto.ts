import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE = 'Password too weak - include uppercase, lowercase, and numbers';

/**
 * Registration payload. The role is never client-writable:
 * it is decided server-side (first user = admin, others = pending).
 */
export class UsersDTO {
  @ApiProperty({ example: 'jane.doe@example.com', maxLength: 255 })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ minLength: 8, description: 'At least 8 chars with upper, lower and digit' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}

export class UpdateUserDTO {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}

export class LoginDTO {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

/** Admin-created user: the only place where a role may be supplied at creation time. */
export class AdminCreateUserDto extends UsersDTO {
  @ApiPropertyOptional({ enum: Role, default: Role.PENDING })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
