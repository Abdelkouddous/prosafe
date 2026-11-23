import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDTO, UsersDTO } from '../users/dto/create-user.dto';
import { validate } from 'class-validator';
import { LoggerService } from '../logger/logger.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/enums/role.enum';
import { EmailVerificationService } from './email-verification.service';

// Code
@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService,
    private jwtService: JwtService,
    private userservice: UsersService,
    private emailVerificationService: EmailVerificationService,
  ) {}
  async login(user: any): Promise<Record<string, any>> {
    try {
      // Check if email is provided
      if (!user.email) {
        return { status: 400, msg: { msg: 'Email is required' } };
      }

      // Check if password is provided
      if (!user.password) {
        return { status: 400, msg: { msg: 'Password is required' } };
      }

      // Get user information
      const userDetails = await this.userservice.findOne(user.email);

      // Check if user exists
      if (!userDetails) {
        return { status: 401, msg: { msg: 'Invalid credentials' } };
      }

      // Check if the given password matches with saved password
      const isValid = await bcrypt.compare(user.password, userDetails.password);
      if (isValid) {
        // Blocked accounts cannot log in
        if (!userDetails.isActive && !userDetails.roles.includes(Role.PENDING)) {
          return { status: 403, msg: { msg: 'Your account is inactive. Please contact an administrator.' } };
        }

        // Check if user is pending
        if (userDetails.roles.includes(Role.PENDING)) {
          return {
            status: 403,
            msg: {
              msg: 'Your account is pending approval. Please contact an administrator.',
            },
          };
        }

        // console.log('logged IN');
        // Generate JWT token
        return {
          status: 200,
          msg: {
            email: user.email,
            access_token: this.jwtService.sign({ email: user.email }),
            user: {
              email: userDetails.email,
              firstName: userDetails.firstName,
              lastName: userDetails.lastName,
              roles: userDetails.roles,
              id: userDetails.id,
            },
          },
        };
      } else {
        // Password does not match
        this.logger.debug('Login failed: invalid credentials');
        return { status: 401, msg: { msg: 'Invalid credentials' } };
      }
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      return { status: 500, msg: { msg: 'Internal server error' } };
    }
  }

  async register(body: any): Promise<Record<string, any>> {
    try {
      // Validation Flag
      let isOk = false;

      // Transform body into DTO
      const userDTO = new UsersDTO();
      userDTO.email = body.email;
      userDTO.firstName = body.firstName;
      userDTO.lastName = body.lastName;
      // Pass raw password; UsersService handles hashing
      userDTO.password = body.password;

      // Bootstrap: the very first user ever registered becomes admin; everyone else is pending approval.
      // The role is never taken from the client payload.
      const role = (await this.userservice.countUsers()) === 0 ? Role.ADMIN : Role.PENDING;

      // Validate DTO against validate function from class-validator
      //
      await validate(userDTO).then((errors) => {
        if (errors.length > 0) {
          this.logger.debug(`Registration validation failed (${errors.length} error(s))`);
        } else {
          isOk = true;
        }
      });
      if (isOk) {
        let createError: any = null;
        const createdUser = await this.userservice.create(userDTO, role).catch((error) => {
          createError = error;
          isOk = false;
        });
        if (createError && !(createError instanceof BadRequestException) && createError.code !== '23505') {
          // Not a duplicate email (BadRequest from UsersService or unique violation): surface the real failure.
          this.logger.error(`Registration failed: ${createError.message}`, createError.stack);
          return { status: 500, content: { msg: 'Internal server error' } };
        }
        if (isOk) {
          try {
            if (createdUser) {
              const tokenEntity = await this.emailVerificationService.createToken(createdUser);
              await this.emailVerificationService.sendVerificationEmail(createdUser, tokenEntity.token);
            }
          } catch (mailErr) {
            this.logger.warn(`Failed sending verification email: ${mailErr.message}`);
          }
          return { status: 201, content: { msg: 'User created with success' } };
        } else {
          return { status: 400, content: { msg: 'User already exists' } };
        }
      } else {
        return { status: 400, content: { msg: 'Invalid content' } };
      }
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      return { status: 500, content: { msg: 'Internal server error' } };
    }
  }
}
