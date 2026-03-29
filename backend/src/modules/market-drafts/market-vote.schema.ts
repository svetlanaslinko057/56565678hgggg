import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketVoteDocument = MarketVote & Document;

export enum VoteStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

@Schema({ _id: false })
export class VoteRecord {
  @Prop({ required: true })
  wallet: string;

  @Prop({ required: true })
  vote: string; // outcome id

  @Prop()
  nftTokenId?: string;

  @Prop({ required: true })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class MarketVote {
  @Prop({ required: true })
  marketId: string;

  @Prop({ required: true })
  proposedOutcome: string;

  @Prop()
  disputeReason?: string;

  @Prop({ type: String, enum: VoteStatus, default: VoteStatus.ACTIVE })
  status: VoteStatus;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: [VoteRecord], default: [] })
  votes: VoteRecord[];

  @Prop({ default: 0 })
  votesFor: number; // votes for proposed outcome

  @Prop({ default: 0 })
  votesAgainst: number; // votes against

  @Prop({ default: 10 })
  minVotesRequired: number;

  @Prop()
  finalOutcome?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string;

  // Snapshot of NFT holders at vote start
  @Prop({ type: [String], default: [] })
  eligibleVoters: string[];
}

export const MarketVoteSchema = SchemaFactory.createForClass(MarketVote);

// Indexes
MarketVoteSchema.index({ marketId: 1 });
MarketVoteSchema.index({ status: 1 });
MarketVoteSchema.index({ endTime: 1 });
