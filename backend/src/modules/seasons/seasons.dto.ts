import { IsString, IsOptional, IsNumber, IsEnum, IsDate, Min, Max } from 'class-validator';
import { SeasonStatus } from './seasons.schema';

export class CreateSeasonDto {
  @IsString()
  seasonId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;
}

export class UpdateSeasonStatsDto {
  @IsOptional()
  @IsNumber()
  predictions?: number;

  @IsOptional()
  @IsNumber()
  wins?: number;

  @IsOptional()
  @IsNumber()
  losses?: number;

  @IsOptional()
  @IsNumber()
  totalStake?: number;

  @IsOptional()
  @IsNumber()
  totalProfit?: number;

  @IsOptional()
  @IsNumber()
  duelWins?: number;

  @IsOptional()
  @IsNumber()
  duelLosses?: number;

  @IsOptional()
  @IsNumber()
  duelWinnings?: number;
}

export class LeaderboardQueryDto {
  @IsOptional()
  @IsString()
  season?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'leaguePoints' | 'roi' | 'accuracy' | 'profit';
}

export class LeaderboardEntryResponse {
  rank: number;
  wallet: string;
  username: string;
  avatar: string;
  roi: number;
  accuracy: number;
  leaguePoints: number;
  predictions: number;
  wins: number;
}

export class SeasonSnapshotResponse {
  rank: number;
  totalPlayers: number;
  percentile: number;
  roi: number;
  accuracy: number;
  leaguePoints: number;
  predictions: number;
  wins: number;
  losses: number;
  duelWins: number;
  duelLosses: number;
}

export class ProfitLeaderboardEntry {
  rank: number;
  wallet: string;
  username: string;
  avatar: string;
  profit: number;
  positions: number;
  volume: number;
}
