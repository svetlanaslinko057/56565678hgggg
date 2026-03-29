import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChainEventDocument = ChainEvent & Document;

@Schema({ timestamps: true })
export class ChainEvent {
  @Prop({ required: true })
  chainId: number;

  @Prop({ required: true })
  txHash: string;

  @Prop({ required: true })
  logIndex: number;

  @Prop({ required: true })
  eventName: string;

  @Prop()
  marketId: string;

  @Prop()
  outcomeId: number;

  @Prop()
  tokenId: string;

  @Prop()
  user: string;

  @Prop()
  amount: string;

  @Prop({ required: true })
  blockNumber: number;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object })
  raw: Record<string, any>;
}

export const ChainEventSchema = SchemaFactory.createForClass(ChainEvent);

// Indexes
ChainEventSchema.index({ txHash: 1, logIndex: 1 }, { unique: true });
ChainEventSchema.index({ eventName: 1 });
ChainEventSchema.index({ marketId: 1 });
ChainEventSchema.index({ user: 1 });
ChainEventSchema.index({ blockNumber: 1 });
ChainEventSchema.index({ timestamp: -1 });
