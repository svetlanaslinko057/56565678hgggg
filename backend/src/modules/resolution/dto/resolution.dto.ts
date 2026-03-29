import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { 
  ResolutionMode, 
  OracleMetric, 
  OracleOperator, 
  ResolutionOutcome 
} from '../../predictions/predictions.schema';

export class CreateResolutionConfigDto {
  @IsEnum(ResolutionMode)
  mode: ResolutionMode;

  // Oracle config
  @IsOptional()
  @IsEnum(OracleMetric)
  metric?: OracleMetric;

  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsEnum(OracleOperator)
  operator?: OracleOperator;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsString()
  evaluationTime?: string;

  @IsOptional()
  @IsString()
  source?: string;

  // Admin config
  @IsOptional()
  @IsString()
  @MinLength(20)
  instructions?: string;
}

export class AdminResolveDto {
  @IsEnum(ResolutionOutcome)
  outcome: ResolutionOutcome;

  @IsString()
  @MinLength(10)
  reason: string;

  @IsOptional()
  @IsString()
  adminId?: string;
}

export class RunOracleCheckDto {
  @IsOptional()
  @IsString()
  marketId?: string;
}

export class DisputeMarketDto {
  @IsString()
  @MinLength(20)
  reason: string;

  @IsOptional()
  @IsString()
  evidence?: string;
}
