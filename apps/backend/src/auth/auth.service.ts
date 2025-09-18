import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync, hashSync } from 'bcryptjs';
import { LoginDTO, UsersDTO } from 'src/users/dto/create-user.dto';
import { validate } from 'class-validator';
import { LoggerService } from 'src/logger/logger.service';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/users/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService = new Logger(AuthService.name),
    private jwtService: JwtService,
    private userservice: UsersService,
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
      const isValid = compareSync(user.password, userDetails.password);
      if (isValid) {
        // Check if user is pending
        if (userDetails.roles.includes(Role.pending)) {
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
        this.logger.debug(`Password mismatch for user: ${user.email}`);
        return { status: 401, msg: { msg: 'Invalid credentials' } };
      }
    } catch (error) {
      this.logger.debug(`Login error: ${error.message}`);
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
      // Hash the password before saving
      userDTO.password = hashSync(body.password, 10);

      // Check if this is the first admin account
      const allUsers = await this.userservice.findAll();
      if (allUsers.length === 0 || body.email === 'admin@prosafe.dz') {
        userDTO.role = Role.admin;
      } else {
        userDTO.role = Role.pending;
      }

      // Validate DTO against validate function from class-validator
      //
      await validate(userDTO).then((errors) => {
        if (errors.length > 0) {
          this.logger.debug(`${errors}`);
        } else {
          isOk = true;
        }
      });
      if (isOk) {
        await this.userservice.create(userDTO).catch((error) => {
          this.logger.debug(error.message);
          isOk = false;
        });
        if (isOk) {
          return { status: 201, content: { msg: 'User created with success' } };
        } else {
          return { status: 400, content: { msg: 'User already exists' } };
        }
      } else {
        return { status: 400, content: { msg: 'Invalid content' } };
      }
    } catch (error) {
      this.logger.debug(error.message);
      return { status: 500, content: { msg: 'Internal server error' } };
    }
  }

  async delete(body: any): Promise<Record<string, any>> {
    try {
    } catch (error) {
      this.logger.debug(error.message);
      return { status: 500, content: { msg: 'Internal server error' } };
    }
  }
}
