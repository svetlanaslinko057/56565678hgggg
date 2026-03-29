import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArenaUser, ArenaUserSchema } from './users.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ArenaUser.name, schema: ArenaUserSchema },
    ]),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
