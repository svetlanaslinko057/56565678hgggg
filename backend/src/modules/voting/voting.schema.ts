import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DisputeVoteDocument = DisputeVote & Document;

export enum VoteChoice {
  YES = 'yes',
  NO = 'no',
}

@Schema({ timestamps: true, collection: 'dispute_votes' })
export class DisputeVote {
  @Prop({ required: true, index: true })
  marketId: string;

  @Prop({ required: true, index: true })
  wallet: string;

  @Prop({ type: String, enum: VoteChoice, required: true })
  choice: VoteChoice;

  @Prop({ default: 1 })
  weight: number;

  @Prop()
  nftCount?: number;

  @Prop()
  createdAt?: Date;
}

export const DisputeVoteSchema = SchemaFactory.createForClass(DisputeVote);

// Unique compound index: one wallet can vote once per market
DisputeVoteSchema.index({ marketId: 1, wallet: 1 }, { unique: true });

// Voting Status enum for market
export enum VotingStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  FINISHED = 'finished',
}

// Voting Config interface (added to market schema)
export interface VotingConfig {
  enabled: boolean;
  status: VotingStatus;
  startedAt?: Date;
  endsAt?: Date;
  result?: 'yes' | 'no' | 'invalid';
  totalVotes?: number;
  yesVotes?: number;
  noVotes?: number;
  requiredRole?: 'nft_holder' | 'any';
  durationHours?: number;
}
