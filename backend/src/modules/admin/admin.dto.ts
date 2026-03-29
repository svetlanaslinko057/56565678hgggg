import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMarketDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  category: string;

  @IsArray()
  outcomes: { id: string; label: string }[];

  @Type(() => Date)
  closeTime: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  initialLiquidity?: number;

  @IsString()
  @IsOptional()
  riskLevel?: string;

  @IsString()
  @IsOptional()
  type?: string;
}

export class ResolveMarketDto {
  @IsString()
  winningOutcome: string;

  @IsString()
  @IsOptional()
  resolutionNote?: string;
}

export class SimulateMarketDto {
  @IsString()
  outcomeId: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  tier?: string;

  @IsNumber()
  @IsOptional()
  xp?: number;

  @IsOptional()
  verified?: boolean;

  @IsOptional()
  banned?: boolean;
}

export class CreateSeasonDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Date)
  startDate: Date;

  @Type(() => Date)
  endDate: Date;
}

export class AdminPaginationDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: string;
}
