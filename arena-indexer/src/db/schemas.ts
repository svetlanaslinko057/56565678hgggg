import mongoose, { Schema, Document } from 'mongoose';

// ============== PROCESSED EVENTS (DEDUPE) ==============
export interface IProcessedEvent extends Document {
  key: string; // chainId:txHash:logIndex
  txHash: string;
  logIndex: number;
  blockNumber: number;
  eventName: string;
  processedAt: Date;
}

const ProcessedEventSchema = new Schema<IProcessedEvent>({
  key: { type: String, unique: true, required: true, index: true },
  txHash: { type: String, required: true },
  logIndex: { type: Number, required: true },
  blockNumber: { type: Number, required: true, index: true },
  eventName: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

// ============== MARKETS MIRROR ==============
export interface IMarketMirror extends Document {
  marketId: number;
  question: string;
  outcomeLabels: string[];
  outcomeCount: number;
  endTime: number;
  status: 'active' | 'locked' | 'resolved' | 'disputed' | 'cancelled';
  resolvedOutcome?: number;
  totalStaked: string;
  totalWinningStaked: string;
  createdAt: Date;
  updatedAt: Date;
  txHash: string;
  blockNumber: number;
}

const MarketMirrorSchema = new Schema<IMarketMirror>({
  marketId: { type: Number, unique: true, required: true, index: true },
  question: { type: String, required: true },
  outcomeLabels: { type: [String], default: [] },
  outcomeCount: { type: Number, required: true },
  endTime: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'locked', 'resolved', 'disputed', 'cancelled'],
    default: 'active',
    index: true 
  },
  resolvedOutcome: { type: Number },
  totalStaked: { type: String, default: '0' },
  totalWinningStaked: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  txHash: { type: String, required: true },
  blockNumber: { type: Number, required: true },
});

// ============== POSITIONS MIRROR ==============
export interface IPositionMirror extends Document {
  tokenId: number;
  marketId: number;
  owner: string;
  outcome: number;
  amount: string;
  claimed: boolean;
  status: 'open' | 'won' | 'lost' | 'claimed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  txHash: string;
  blockNumber: number;
}

const PositionMirrorSchema = new Schema<IPositionMirror>({
  tokenId: { type: Number, unique: true, required: true, index: true },
  marketId: { type: Number, required: true, index: true },
  owner: { type: String, required: true, lowercase: true, index: true },
  outcome: { type: Number, required: true },
  amount: { type: String, required: true },
  claimed: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['open', 'won', 'lost', 'claimed', 'refunded'],
    default: 'open',
    index: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  txHash: { type: String, required: true },
  blockNumber: { type: Number, required: true },
});

// ============== ACTIVITIES ==============
export interface IActivity extends Document {
  type: 'bet_placed' | 'position_claimed' | 'position_refunded' | 'market_created' | 'market_resolved' | 'market_cancelled' | 'transfer';
  user: string;
  marketId?: number;
  tokenId?: number;
  amount?: string;
  outcome?: number;
  data: Record<string, any>;
  txHash: string;
  blockNumber: number;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  type: { 
    type: String, 
    enum: ['bet_placed', 'position_claimed', 'position_refunded', 'market_created', 'market_resolved', 'market_cancelled', 'transfer'],
    required: true,
    index: true 
  },
  user: { type: String, lowercase: true, index: true },
  marketId: { type: Number, index: true },
  tokenId: { type: Number },
  amount: { type: String },
  outcome: { type: Number },
  data: { type: Schema.Types.Mixed, default: {} },
  txHash: { type: String, required: true },
  blockNumber: { type: Number, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

// ============== INDEXER STATE ==============
export interface IIndexerState extends Document {
  key: string;
  lastSyncedBlock: number;
  updatedAt: Date;
}

const IndexerStateSchema = new Schema<IIndexerState>({
  key: { type: String, unique: true, default: 'main' },
  lastSyncedBlock: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// ============== MODELS ==============
// Using explicit collection names to prevent mongoose pluralization
export const ProcessedEventModel = mongoose.model<IProcessedEvent>('ProcessedEvent', ProcessedEventSchema, 'processed_events');
export const MarketMirrorModel = mongoose.model<IMarketMirror>('MarketMirror', MarketMirrorSchema, 'markets_mirror');
export const PositionMirrorModel = mongoose.model<IPositionMirror>('PositionMirror', PositionMirrorSchema, 'positions_mirror');
export const ActivityModel = mongoose.model<IActivity>('Activity', ActivitySchema, 'activities');
export const IndexerStateModel = mongoose.model<IIndexerState>('IndexerState', IndexerStateSchema, 'indexer_state');
