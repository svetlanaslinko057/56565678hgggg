import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalystsController } from './analysts.controller';
import { AnalystsService } from './analysts.service';
import { Analyst, AnalystSchema } from './analysts.schema';
import { SeasonsModule } from '../seasons/seasons.module';
import { ArenaUser, ArenaUserSchema } from '../users/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analyst.name, schema: AnalystSchema },
      { name: ArenaUser.name, schema: ArenaUserSchema },
    ]),
    forwardRef(() => SeasonsModule),
  ],
  controllers: [AnalystsController],
  providers: [AnalystsService],
  exports: [AnalystsService],
})
export class AnalystsModule {}
