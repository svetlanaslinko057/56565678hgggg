import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { DuelStatus } from './duels.schema';

export class CreateDuelDto {
  @IsString()
  marketId: string;

  @IsOptional()
  @IsString()
  predictionId?: string;

  @IsEnum(['yes', 'no'])
  side: 'yes' | 'no';

  @IsNumber()
  @Min(1)
  stakeAmount: number;

  @IsOptional()
  @IsString()
  opponentWallet?: string;

  @IsOptional()
  @IsString()
  predictionTitle?: string;
}

export class DuelFiltersDto {
  @IsOptional()
  @IsEnum(DuelStatus)
  status?: DuelStatus;

  @IsOptional()
  @IsString()
  wallet?: string;

  @IsOptional()
  @IsString()
  marketId?: string;
}

export class DuelSummaryResponse {
  activeDuels: number;
  wins: number;
  losses: number;
  streak: number;
  winRate: number;
  totalDuels: number;
  bestStreak: number;
}
