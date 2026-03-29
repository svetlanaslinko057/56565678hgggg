import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { WinCardController } from './win-card.controller';
import { WinCardService } from './win-card.service';
import { ShareLink, ShareLinkSchema } from './share.schema';
import { Position, PositionSchema } from '../positions/positions.schema';
import { Prediction, PredictionSchema } from '../predictions/predictions.schema';
import { Analyst, AnalystSchema } from '../analysts/analysts.schema';
import { Duel, DuelSchema } from '../duels/duels.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShareLink.name, schema: ShareLinkSchema },
      { name: Position.name, schema: PositionSchema },
      { name: Prediction.name, schema: PredictionSchema },
      { name: Analyst.name, schema: AnalystSchema },
      { name: Duel.name, schema: DuelSchema },
    ]),
  ],
  controllers: [ShareController, WinCardController],
  providers: [ShareService, WinCardService],
  exports: [ShareService, WinCardService],
})
export class ShareModule {}
