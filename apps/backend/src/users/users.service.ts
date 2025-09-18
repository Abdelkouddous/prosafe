import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersDTO } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';

// This should be a real class/interface representing a user entity
// export type User = any;

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  create(createUserDto: UsersDTO): Promise<User> {
    const user = new User();

    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.email = createUserDto.email;
    user.password = createUserDto.password;
    user.roles = [createUserDto.role || Role.standard]; // Set role from DTO or use standard as default

    return this.usersRepository.save(user);
  }
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  findById(id: number): Promise<User> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async remove(email: string): Promise<void> {
    await this.usersRepository.delete(email);
  }

  async update(email: string, updateUserDto: UsersDTO): Promise<User> {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new Error('User not found');
    }

    user.firstName = updateUserDto.firstName;
    user.lastName = updateUserDto.lastName;
    user.email = updateUserDto.email;
    user.password = updateUserDto.password;

    return this.usersRepository.save(user);
  }

  async updateUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
