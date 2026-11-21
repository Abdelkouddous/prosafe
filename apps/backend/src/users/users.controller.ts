import { Controller, Get, Body, Patch, UseGuards, Request, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';

/**
 * Self-service profile endpoints for the authenticated user.
 * User administration (approve/block/role/delete) lives in AuthController (`/auth/users*`).
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private userId(req: any): number {
    const id = req.user?.id;
    if (!id) throw new UnauthorizedException();
    return id;
  }

  /** GET /users/profile - current user profile (without password) */
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(this.userId(req));
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * PATCH /users/profile - update firstName, lastName, phone, department, zone.
   * Unknown fields sent by clients (email, phone...) are silently stripped, never applied.
   */
  @Patch('profile')
  async updateProfile(
    @Request() req,
    // Typed as a plain object so the global (forbidNonWhitelisted) pipe skips it; this pipe validates + strips extras.
    @Body(new ValidationPipe({ expectedType: UpdateUserDto, whitelist: true, forbidNonWhitelisted: false, transform: true }))
    updateUserDto: Record<string, any>,
  ) {
    const updated = await this.usersService.updateProfile(this.userId(req), updateUserDto);
    const { password, ...userWithoutPassword } = updated;
    return { message: 'Profile updated successfully', user: userWithoutPassword };
  }

  /** PATCH /users/change-password */
  @Patch('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(this.userId(req), changePasswordDto);
    return { message: 'Password changed successfully' };
  }
}
