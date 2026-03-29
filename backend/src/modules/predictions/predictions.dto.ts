import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PredictionType, RiskLevel } from './predictions.schema';

export class OutcomeDto {
  @IsString()
  id: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsNumber()
  probability?: number;
}

export class CreatePredictionDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PredictionType)
  type?: PredictionType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutcomeDto)
  outcomes: OutcomeDto[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsDateString()
  closeTime: string;

  @IsOptional()
  @IsDateString()
  resolveTime?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  resolutionSource?: string;
}

export class UpdatePredictionDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutcomeDto)
  outcomes?: OutcomeDto[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsDateString()
  closeTime?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;
}
