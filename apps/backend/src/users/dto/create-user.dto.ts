import { IsEmail, isEnum, IsNotEmpty, isString, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

export class UsersDTO {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
  // Password validation rules:
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password too weak - include uppercase, lowercase, and numbers',
  })
  password: string;

  @IsString()
  role: Role = Role.pending; // Default role is pending
}

export class UpdateUserDTO {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password too weak - include uppercase, lowercase, and numbers',
  })
  password: string;
}

export class LoginDTO {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;
  @IsString()
  password: string;
}
