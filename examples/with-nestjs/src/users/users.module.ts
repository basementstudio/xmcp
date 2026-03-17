import { Module, Global } from '@nestjs/common';
import { UsersService, getUsersService } from './users.service';
import { UsersController } from './users.controller';

@Global()
@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: UsersService,
      useFactory: () => getUsersService(),
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
