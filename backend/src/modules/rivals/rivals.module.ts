import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RivalsController } from './rivals.controller';
import { RivalsService } from './rivals.service';
import { Rivalry, RivalrySchema } from './rivals.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rivalry.name, schema: RivalrySchema },
    ]),
  ],
  controllers: [RivalsController],
  providers: [RivalsService],
  exports: [RivalsService],
})
export class RivalsModule {}
