import { IsString, IsOptional } from 'class-validator';

export class CreateShareLinkDto {
  @IsString()
  positionId: string;

  @IsString()
  @IsOptional()
  refWallet?: string;
}

export class TrackReferralDto {
  @IsString()
  shareId: string;

  @IsString()
  newUserWallet: string;
}
