import { IsString, IsOptional } from 'class-validator';

export class UpdateAnalystDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class AnalystProfileResponse {
  wallet: string;
  username: string;
  avatar: string;
  bio: string;
  rank: number;
  tier: string;
  badges: string[];
  verified: boolean;
  xp: number;
  stats: {
    totalPredictions: number;
    currentStreak: number;
    bestStreak: number;
    winRate: number;
    wins: number;
    losses: number;
  };
  performance: {
    roi: number;
    accuracy: number;
    totalProfit: number;
  };
  duelStats: {
    wins: number;
    losses: number;
    winRate: number;
  };
  createdAt: Date;
}

export class TopPredictionResponse {
  id: string;
  title: string;
  outcome: string;
  roi: number;
  stake: number;
  profit: number;
  resolvedAt: Date;
}
