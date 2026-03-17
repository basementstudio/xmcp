import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  private users: Map<string, User> = new Map();

  constructor() {
    // Seed with some initial users
    this.seedUsers();
  }

  private seedUsers() {
    const seedData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' },
    ];

    seedData.forEach((userData) => {
      const id = randomUUID();
      const now = new Date();
      this.users.set(id, {
        id,
        ...userData,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  create(createUserDto: CreateUserDto): User {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      ...createUserDto,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  findAll(): User[] {
    return Array.from(this.users.values());
  }

  findOne(id: string): User {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  remove(id: string): void {
    if (!this.users.has(id)) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    this.users.delete(id);
  }

  count(): number {
    return this.users.size;
  }
}

// Export a singleton instance for use in XMCP tools
// This allows tools to access the same data as the REST API
let usersServiceInstance: UsersService | null = null;

export function getUsersService(): UsersService {
  if (!usersServiceInstance) {
    usersServiceInstance = new UsersService();
  }
  return usersServiceInstance;
}
