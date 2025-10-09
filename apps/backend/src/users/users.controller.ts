import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  Query,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersDTO, LoginDTO } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto, ChangeRoleDto, AdminUpdateUserDto } from './dto/update-user.dto';
import { Role } from './enums/role.enum';

/**
 * Users Controller
 * Handles all user-related HTTP requests including:
 * - User registration and authentication
 * - Profile management
 * - Password changes
 * - Role management (admin only)
 * - User approval and deactivation (admin only)
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Register a new user
   * POST /users/register
   * @param createUserDto - User registration data
   * @returns Created user (without password)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: UsersDTO) {
    const user = await this.usersService.create(createUserDto);
    // Remove password from response for security
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'User registered successfully. Awaiting admin approval.',
      user: userWithoutPassword,
    };
  }

  /**
   * User login validation
   * POST /users/login
   * @param loginDto - Login credentials
   * @returns User data if credentials are valid
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDTO) {
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not active. Please contact administrator.');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'Login successful',
      user: userWithoutPassword,
    };
  }

  /**
   * Get all users (admin only)
   * GET /users
   * @param role - Optional role filter
   * @returns Array of all users
   */
  @Get()
  async findAll(@Query('role') role?: Role) {
    let users;

    if (role) {
      // Validate role enum
      if (!Object.values(Role).includes(role)) {
        throw new BadRequestException('Invalid role specified');
      }
      users = await this.usersService.getUsersByRole(role);
    } else {
      users = await this.usersService.findAll();
    }

    // Remove passwords from response
    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Get pending users for approval (admin only)
   * GET /users/pending
   * @returns Array of users awaiting approval
   */
  @Get('pending')
  async getPendingUsers() {
    const pendingUsers = await this.usersService.getPendingUsers();

    // Remove passwords from response
    return pendingUsers.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Get current user profile
   * GET /users/profile
   * @param req - Request object containing user info
   * @returns Current user profile
   */
  @Get('profile')
  async getProfile(@Request() req) {
    // In a real app, you'd get user ID from JWT token
    // For now, assuming user ID is passed in request
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const user = await this.usersService.findById(userId);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID (admin only)
   * GET /users/:id
   * @param id - User ID
   * @returns User data
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update current user profile
   * PATCH /users/profile
   * @param req - Request object containing user info
   * @param updateUserDto - Profile update data
   * @returns Updated user profile
   */
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const updatedUser = await this.usersService.updateProfile(userId, updateUserDto);
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    };
  }

  /**
   * Change user password
   * PATCH /users/change-password
   * @param req - Request object containing user info
   * @param changePasswordDto - Password change data
   * @returns Success message
   */
  @Patch('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    await this.usersService.changePassword(userId, changePasswordDto);

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * Approve user (admin only)
   * PATCH /users/:id/approve
   * @param id - User ID to approve
   * @returns Approved user data
   */
  @Patch(':id/approve')
  async approveUser(@Param('id', ParseIntPipe) id: number) {
    const approvedUser = await this.usersService.approveUser(id);
    const { password, ...userWithoutPassword } = approvedUser;

    return {
      message: 'User approved successfully',
      user: userWithoutPassword,
    };
  }

  /**
   * Deactivate user (admin only)
   * PATCH /users/:id/deactivate
   * @param id - User ID to deactivate
   * @returns Deactivated user data
   */
  @Patch(':id/deactivate')
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    const deactivatedUser = await this.usersService.deactivateUser(id);
    const { password, ...userWithoutPassword } = deactivatedUser;

    return {
      message: 'User deactivated successfully',
      user: userWithoutPassword,
    };
  }

  /**
   * Change user role (admin only)
   * PATCH /users/:id/role
   * @param id - User ID
   * @param changeRoleDto - New role data
   * @returns Updated user data
   */
  @Patch(':id/role')
  async changeUserRole(@Param('id', ParseIntPipe) id: number, @Body() changeRoleDto: ChangeRoleDto) {
    const updatedUser = await this.usersService.changeRole(id, changeRoleDto);
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      message: 'User role updated successfully',
      user: userWithoutPassword,
    };
  }

  /**
   * Admin update user (admin only)
   * PATCH /users/:id/admin-update
   * @param id - User ID
   * @param adminUpdateDto - Admin update data
   * @returns Updated user data
   */
  @Patch(':id/admin-update')
  async adminUpdateUser(@Param('id', ParseIntPipe) id: number, @Body() adminUpdateDto: AdminUpdateUserDto) {
    const updatedUser = await this.usersService.adminUpdateUser(id, adminUpdateDto);
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      message: 'User updated successfully by admin',
      user: userWithoutPassword,
    };
  }

  /**
   * Delete user (admin only)
   * DELETE /users/:id
   * @param id - User ID to delete
   * @returns Success message
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    await this.usersService.remove(user.email);

    return {
      message: 'User deleted successfully',
    };
  }

  /**
   * Permanently delete user and related data (admin only)
   * DELETE /users/:id/hard
   * @param id - User ID to hard delete
   * @returns Success message
   */
  @Delete(':id/hard')
  async hardDelete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const requester = req.user;
    if (!requester?.roles?.includes(Role.admin)) {
      throw new ForbiddenException('Only admins can permanently delete users');
    }

    await this.usersService.hardDeleteById(id);

    return {
      message: 'User and related data permanently deleted',
      deletedUserId: id,
    };
  }

  /**
   * Get user statistics (admin only)
   * GET /users/stats/overview
   * @returns User statistics
   */
  @Get('stats/overview')
  async getUserStats() {
    const allUsers = await this.usersService.findAll();
    const pendingUsers = await this.usersService.getPendingUsers();
    const adminUsers = await this.usersService.getUsersByRole(Role.admin);
    const standardUsers = await this.usersService.getUsersByRole(Role.standard);
    const premiumUsers = await this.usersService.getUsersByRole(Role.premium);

    const activeUsers = allUsers.filter((user) => user.isActive);
    const inactiveUsers = allUsers.filter((user) => !user.isActive);

    return {
      total: allUsers.length,
      active: activeUsers.length,
      inactive: inactiveUsers.length,
      pending: pendingUsers.length,
      byRole: {
        admin: adminUsers.length,
        standard: standardUsers.length,
        premium: premiumUsers.length,
        pending: pendingUsers.length,
      },
    };
  }
}
