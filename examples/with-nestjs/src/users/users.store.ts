import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { randomUUID } from 'crypto';

/**
 * Plain users store without NestJS decorators.
 * Used by xmcp tools to access user data.
 */
export class UsersStore {
  private users: Map<string, User> = new Map();

  constructor() {
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
      throw new Error(`User with ID "${id}" not found`);
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
      throw new Error(`User with ID "${id}" not found`);
    }
    this.users.delete(id);
  }

  count(): number {
    return this.users.size;
  }
}

// Singleton instance for tools
let usersStoreInstance: UsersStore | null = null;

export function getUsersStore(): UsersStore {
  if (!usersStoreInstance) {
    usersStoreInstance = new UsersStore();
  }
  return usersStoreInstance;
}
