import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersDTO } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto, ChangeRoleDto, AdminUpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  /**
   * Create a new user with hashed password
   * @param createUserDto - User creation data
   * @returns Promise<User> - Created user
   */
  async create(createUserDto: UsersDTO): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findOne(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = new User();
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.email = createUserDto.email;
    user.password = await bcrypt.hash(createUserDto.password, 10);
    user.roles = [createUserDto.role || Role.pending]; // Default to pending for approval
    user.isActive = false; // New users start inactive until approved

    return this.usersRepository.save(user);
  }

  /**
   * Get all users
   * @returns Promise<User[]> - Array of all users
   */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns Promise<User | null> - User or null if not found
   */
  async findOne(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise<User> - User entity
   * @throws NotFoundException if user not found
   */
  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Remove user by email
   * @param email - User email
   * @throws NotFoundException if user not found
   */
  async remove(email: string): Promise<void> {
    const user = await this.findOne(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.delete({ email });
  }

  /**
   * Update user profile (for regular users)
   * @param userId - User ID
   * @param updateUserDto - Update data
   * @returns Promise<User> - Updated user
   */
  async updateProfile(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    if (updateUserDto.firstName) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) user.lastName = updateUserDto.lastName;
    if (updateUserDto.email) {
      // Check if new email is already taken
      const existingUser = await this.findOne(updateUserDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
      user.email = updateUserDto.email;
    }

    return this.usersRepository.save(user);
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param changePasswordDto - Password change data
   * @returns Promise<User> - Updated user
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<User> {
    const user = await this.findById(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password matches confirmation
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Hash and save new password
    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    return this.usersRepository.save(user);
  }

  /**
   * Change user role (admin only)
   * @param userId - User ID
   * @param changeRoleDto - Role change data
   * @returns Promise<User> - Updated user
   */
  async changeRole(userId: number, changeRoleDto: ChangeRoleDto): Promise<User> {
    const user = await this.findById(userId);
    user.roles = [changeRoleDto.role];
    return this.usersRepository.save(user);
  }

  /**
   * Admin update user (admin only)
   * @param userId - User ID
   * @param adminUpdateDto - Admin update data
   * @returns Promise<User> - Updated user
   */
  async adminUpdateUser(userId: number, adminUpdateDto: AdminUpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    if (adminUpdateDto.firstName) user.firstName = adminUpdateDto.firstName;
    if (adminUpdateDto.lastName) user.lastName = adminUpdateDto.lastName;
    if (adminUpdateDto.email) {
      // Check if new email is already taken
      const existingUser = await this.findOne(adminUpdateDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
      user.email = adminUpdateDto.email;
    }
    if (adminUpdateDto.role) user.roles = [adminUpdateDto.role];
    if (adminUpdateDto.isActive !== undefined) user.isActive = adminUpdateDto.isActive;

    return this.usersRepository.save(user);
  }

  /**
   * Approve user (admin only)
   * @param userId - User ID
   * @returns Promise<User> - Approved user
   */
  async approveUser(userId: number): Promise<User> {
    const user = await this.findById(userId);
    user.isActive = true;
    user.roles = [Role.standard]; // Promote from pending to standard
    return this.usersRepository.save(user);
  }

  /**
   * Deactivate user (admin only)
   * @param userId - User ID
   * @returns Promise<User> - Deactivated user
   */
  async deactivateUser(userId: number): Promise<User> {
    const user = await this.findById(userId);
    user.isActive = false;
    return this.usersRepository.save(user);
  }

  /**
   * Get users by role
   * @param role - User role
   * @returns Promise<User[]> - Users with specified role
   */
  async getUsersByRole(role: Role): Promise<User[]> {
    return this.usersRepository.find({
      where: { roles: role },
    });
  }

  /**
   * Get pending users (for admin approval)
   * @returns Promise<User[]> - Pending users
   */
  async getPendingUsers(): Promise<User[]> {
    return this.getUsersByRole(Role.pending);
  }

  /**
   * Validate user password for login
   * @param email - User email
   * @param password - Plain text password
   * @returns Promise<User | null> - User if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findOne(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  /**
   * Update user (legacy method - kept for compatibility)
   * @param email - User email
   * @param updateUserDto - Update data
   * @returns Promise<User> - Updated user
   */
  async update(email: string, updateUserDto: UsersDTO): Promise<User> {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.firstName = updateUserDto.firstName;
    user.lastName = updateUserDto.lastName;
    user.email = updateUserDto.email;
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.usersRepository.save(user);
  }

  /**
   * Update user entity (legacy method - kept for compatibility)
   * @param user - User entity
   * @returns Promise<User> - Updated user
   */
  async updateUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
