import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateUserInput } from '../../common/interfaces/create-user-input.interface.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await this.usersRepository.increment({ id }, 'tokenVersion', 1);
  }

  create(input: CreateUserInput): Promise<User> {
    return this.usersRepository.save(this.usersRepository.create(input), {
      transaction: false,
    });
  }
}
