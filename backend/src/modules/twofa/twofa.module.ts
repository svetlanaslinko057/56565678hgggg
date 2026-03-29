import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TwoFaController } from './twofa.controller';
import { TwoFaService } from './twofa.service';
import { ArenaUserSchema } from '../users/users.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ArenaUser', schema: ArenaUserSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [TwoFaController],
  providers: [TwoFaService],
  exports: [TwoFaService],
})
export class TwoFaModule {}
