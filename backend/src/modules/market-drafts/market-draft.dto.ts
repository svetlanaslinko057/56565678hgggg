import { 
  IsString, 
  IsArray, 
  IsOptional, 
  IsDateString, 
  IsNumber, 
  IsEnum,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResolutionType } from './market-draft.schema';

class OutcomeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  probability?: number;
}

class OracleConfigDto {
  @ApiProperty({ description: 'Oracle source: coingecko, chainlink' })
  @IsString()
  source: string;

  @ApiProperty({ description: 'Asset symbol: BTC, ETH, etc.' })
  @IsString()
  asset: string;

  @ApiProperty({ description: 'Comparison operator: >, <, =, >=, <=' })
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Target value to compare' })
  @IsNumber()
  value: number;
}

export class CreateMarketDraftDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: 'single' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ type: [OutcomeDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => OutcomeDto)
  outcomes: OutcomeDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty()
  @IsDateString()
  closeTime: string;

  @ApiPropertyOptional({ enum: ResolutionType })
  @IsOptional()
  @IsEnum(ResolutionType)
  resolutionType?: ResolutionType;

  @ApiPropertyOptional({ type: OracleConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OracleConfigDto)
  oracleConfig?: OracleConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionSource?: string;
}

export class SubmitDraftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class ApproveDraftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class RejectDraftDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'true = burn stake, false = return stake' })
  @IsOptional()
  burnStake?: boolean;
}

export class CastVoteDto {
  @ApiProperty({ description: 'Outcome ID to vote for' })
  @IsString()
  vote: string;

  @ApiPropertyOptional({ description: 'NFT token ID for voting power' })
  @IsOptional()
  @IsString()
  nftTokenId?: string;
}

export class CreateDisputeDto {
  @ApiProperty({ description: 'Proposed outcome to dispute' })
  @IsString()
  proposedOutcome: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Duration in hours (default 24)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationHours?: number;
}
