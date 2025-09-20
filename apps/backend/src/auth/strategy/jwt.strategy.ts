import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { User } from 'src/users/entities/user.entity';
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
    const nodeEnv = configService.get<string>('env');

    // Always use public key for verification in both environments
    // The private key is only used for signing tokens
    const secretKey = publicKey || privateKey; // Fallback to private key if public key is not available

    console.log('JWT Strategy - Environment:', nodeEnv);
    console.log('JWT Strategy - Using key for verification:', publicKey ? 'public' : 'private');
    console.log('JWT Strategy - Public key available:', !!publicKey);
    console.log('JWT Strategy - Private key available:', !!privateKey);

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
    console.log('JWT Strategy - Validating payload:', payload);

    // Accept the JWT and attempt to validate it using the user service
    const user = await this.userservice.findOne(payload.email);

    // If the user is not found, throw an error
    if (!user) {
      console.log('JWT Strategy - User not found for email:', payload.email);
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    // Check if user is active (only if isActive property exists)
    if (user.hasOwnProperty('isActive') && !user.isActive) {
      console.log('JWT Strategy - User is inactive:', payload.email);
      throw new HttpException('User account is inactive', HttpStatus.UNAUTHORIZED);
    }

    console.log('JWT Strategy - User validated successfully:', user.email);
    // If the user is found, return the user
    return user;
  }
}
