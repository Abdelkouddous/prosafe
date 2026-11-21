import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

// a hybrid JWT Approach that makes the JWT token
// work in both production and development environments
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private userservice: UsersService,
    private configService: ConfigService,
  ) {
    const publicKey = configService.get<string>('keys.publicKey');
    const privateKey = configService.get<string>('keys.privateKey');

    // Always use public key for verification in both environments
    // The private key is only used for signing tokens
    const secretKey = publicKey || privateKey; // Fallback to private key if public key is not available

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
      algorithms: ['RS256'],
    });
  }

  /**
   * @description Validate the token and return the user
   * @param payload string
   * @returns User
   */
  async validate(payload: any): Promise<User> {

    // Accept the JWT and attempt to validate it using the user service
    const user = await this.userservice.findOne(payload.email);

    // If the user is not found, throw an error
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Check if user is active (only if isActive property exists)
    if (user.hasOwnProperty('isActive') && !user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }
    // If the user is found, return the user
    return user;
  }
}
