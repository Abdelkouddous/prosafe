import { Body, Controller, Get, Post, Delete, Req, Res, UseGuards, Param, Put, ForbiddenException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategy/jwt-auth.guard';
import { Role } from 'src/users/enums/role.enum';

import { LoggerService } from '../logger/logger.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Post('login')
  async login(@Req() req, @Res() res, @Body() body) {
    const auth = await this.authService.login(body);
    res.status(auth.status).json(auth.msg);
  }

  @Post('register')
  async register(@Req() req, @Res() res, @Body() body) {
    const auth = await this.authService.register(body);
    res.status(auth.status).json(auth.content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:email')
  async deleteUser(@Req() req, @Res() res, @Param('email') email: string) {
    // Check if the user is an admin
    if (!req.user.roles.includes(Role.admin)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    try {
      await this.userService.remove(email);
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(@Req() req, @Res() res) {
    // Check if the user is an admin
    if (!req.user.roles.includes(Role.admin)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const users = await this.userService.findAll();
    res.status(200).json(users);
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:email/approve')
  async approveUser(@Req() req, @Res() res, @Param('email') email: string) {
    // Check if the user is an admin
    if (!req.user.roles.includes(Role.admin)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    try {
      const user = await this.userService.findOne(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user role from pending to standard
      if (user.roles.includes(Role.pending)) {
        const roleIndex = user.roles.indexOf(Role.pending);
        user.roles[roleIndex] = Role.standard;
        await this.userService.updateUser(user);
        return res.status(200).json({ message: 'User approved successfully' });
      } else {
        return res.status(400).json({ message: 'User is not in pending status' });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:email/block')
  async blockUser(@Req() req, @Res() res, @Param('email') email: string) {
    // Check if the user is an admin
    if (!req.user.roles.includes(Role.admin)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    try {
      const user = await this.userService.findOne(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Block user by setting isActive to false
      user.isActive = false;
      await this.userService.updateUser(user);
      return res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:email/unblock')
  async unblockUser(@Req() req, @Res() res, @Param('email') email: string) {
    // Check if the user is an admin
    if (!req.user.roles.includes(Role.admin)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    try {
      const user = await this.userService.findOne(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Unblock user by setting isActive to true
      user.isActive = true;
      await this.userService.updateUser(user);
      return res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:email/role')
  async changeUserRole(@Req() req, @Res() res, @Param('email') email: string, @Body() body: { role: Role }) {
    // Check if the user is an admin
    if (!req.user.roles.includes(Role.admin)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    try {
      const user = await this.userService.findOne(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Validate the role
      if (!Object.values(Role).includes(body.role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Change user role
      if (!user.roles.includes(body.role)) {
        // If user already has a role, replace it; otherwise add the new role
        if (user.roles.length > 0) {
          user.roles = [body.role];
        } else {
          user.roles.push(body.role);
        }
        await this.userService.updateUser(user);
        return res.status(200).json({ message: `User role changed to ${body.role} successfully` });
      } else {
        return res.status(400).json({ message: `User already has the role ${body.role}` });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:email/make-admin')
  async makeUserAdmin(@Req() req, @Res() res, @Param('email') email: string) {
    // Check if the user is an admin
    if (!req.user.roles.includes(Role.admin)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    try {
      const user = await this.userService.findOne(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Make user an admin
      if (!user.roles.includes(Role.admin)) {
        user.roles = [Role.admin];
        await this.userService.updateUser(user);
        return res.status(200).json({ message: 'User promoted to admin successfully' });
      } else {
        return res.status(400).json({ message: 'User is already an admin' });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req, @Res() res) {
    // The user object is attached to the request by the JwtAuthGuard
    const user = req.user;

    // Remove sensitive information like password before sending the response
    const { password, ...result } = user;

    res.status(200).json({
      user: result,
      token: req.headers.authorization?.split(' ')[1],
    });
  }
}
