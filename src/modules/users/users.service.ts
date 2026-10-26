import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import type { UserRole } from '../../common/enums/user-role.enum.js';
import type { CreateUserInput } from '../../common/interfaces/create-user-input.interface.js';
import type { ListUsersQuery } from '../../common/interfaces/list-users-query.interface.js';
import type { Paginated } from '../../common/interfaces/paginated.interface.js';
import type { UserResponse } from '../../common/interfaces/user-response.interface.js';
import { toUserResponse } from '../../common/mappers/user.mapper.js';
import { containsPattern } from '../../common/utils/escape-like.util.js';
import { toPaginated, toSkip } from '../../common/utils/pagination.util.js';
import { User } from './entities/user.entity.js';

interface UserRow extends Omit<UserResponse, 'createdAt'> {
  created_at: Date;
}

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

  async list({
    page,
    limit,
    role,
    q,
  }: ListUsersQuery): Promise<Paginated<UserResponse>> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .skip(toSkip(page, limit))
      .take(limit);
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    if (q) {
      query.andWhere(
        new Brackets((search) =>
          search
            .where('user.email ILIKE :pattern')
            .orWhere('user.name ILIKE :pattern'),
        ),
        { pattern: containsPattern(q) },
      );
    }
    const [users, total] = await query.getManyAndCount();
    return toPaginated(users.map(toUserResponse), total, page, limit);
  }

  async updateRole(id: string, role: UserRole): Promise<UserResponse | null> {
    const { raw } = await this.usersRepository
      .createQueryBuilder()
      .update()
      .set({ role })
      .where('id = :id', { id })
      .returning(['id', 'email', 'name', 'role', 'created_at'])
      .execute();
    const [row] = raw as UserRow[];
    return row ? toUserResponse({ ...row, createdAt: row.created_at }) : null;
  }
}
