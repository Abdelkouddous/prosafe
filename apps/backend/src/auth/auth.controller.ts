import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { JwtAuthGuard } from './strategy/jwt-auth.guard';
import { RolesGuard } from './strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { LoginDTO, UsersDTO } from '../users/dto/create-user.dto';
import { ChangeRoleDto } from '../users/dto/update-user.dto';
import { User } from '../users/entities/user.entity';

const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Login (public, 5 req/min)' })
  async login(@Res() res, @Body() body: LoginDTO) {
    const auth = await this.authService.login(body);
    res.status(auth.status).json(auth.msg);
  }

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Register (public, 5 req/min). First user becomes admin, others are pending.' })
  async register(@Res() res, @Body() body: UsersDTO) {
    const auth = await this.authService.register(body);
    res.status(auth.status).json(auth.content);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('users/:email')
  async deleteUser(@Req() req, @Param('email') email: string) {
    if (req.user.email === email) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    await this.userService.remove(email);
    return { message: 'User deleted successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('users')
  async getUsers() {
    const users = await this.userService.findAll();
    return users.map(({ password, ...rest }) => rest);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('users/:email/approve')
  async approveUser(@Param('email') email: string) {
    const user = await this.findUserOrFail(email);
    if (!user.roles.includes(Role.PENDING)) {
      throw new BadRequestException('User is not in pending status');
    }
    user.roles = user.roles.map((r) => (r === Role.PENDING ? Role.EMPLOYEE : r));
    user.isActive = true;
    await this.userService.updateUser(user);
    return { message: 'User approved successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('users/:email/block')
  async blockUser(@Req() req, @Param('email') email: string) {
    if (req.user.email === email) {
      throw new ForbiddenException('You cannot block your own account');
    }
    const user = await this.findUserOrFail(email);
    user.isActive = false;
    await this.userService.updateUser(user);
    return { message: 'User blocked successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('users/:email/unblock')
  async unblockUser(@Param('email') email: string) {
    const user = await this.findUserOrFail(email);
    user.isActive = true;
    await this.userService.updateUser(user);
    return { message: 'User unblocked successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('users/:email/role')
  async changeUserRole(@Req() req, @Param('email') email: string, @Body() body: ChangeRoleDto) {
    if (req.user.email === email) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const user = await this.findUserOrFail(email);
    if (user.roles.includes(body.role)) {
      throw new BadRequestException(`User already has the role ${body.role}`);
    }
    user.roles = [body.role];
    // Leaving the pending state means the account is usable
    if (body.role !== Role.PENDING) user.isActive = true;
    await this.userService.updateUser(user);
    return { message: `User role changed to ${body.role} successfully` };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('users/:email/make-admin')
  async makeUserAdmin(@Param('email') email: string) {
    const user = await this.findUserOrFail(email);
    if (user.roles.includes(Role.ADMIN)) {
      throw new BadRequestException('User is already an admin');
    }
    user.roles = [Role.ADMIN];
    user.isActive = true;
    await this.userService.updateUser(user);
    return { message: 'User promoted to admin successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req) {
    // The user entity is attached to the request by JwtAuthGuard
    const { password, ...result } = req.user as User;
    return { user: result };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Missing token');
    }
    const user = await this.emailVerificationService.verifyToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    // Only marks the email as verified; activation remains an admin approval (never touches isActive).
    user.emailVerified = true;
    await this.userService.updateUser(user);
    return { message: 'Email verified successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(200)
  async resendVerification(@Req() req) {
    const user = req.user;
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }
    const entityUser = await this.userService.findById(user.id);
    await this.emailVerificationService.resendForUser(entityUser);
    return { message: 'Verification email resent' };
  }

  private async findUserOrFail(email: string): Promise<User> {
    const user = await this.userService.findOne(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
