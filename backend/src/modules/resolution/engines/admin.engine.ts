/**
 * Admin Engine - Handles manual resolution by admins
 */

import { Injectable, Logger } from '@nestjs/common';
import { PredictionDocument, ResolutionOutcome } from '../../predictions/predictions.schema';

export interface AdminResolveInput {
  outcome: ResolutionOutcome;
  reason: string;
  adminId?: string;
}

export interface AdminResult {
  success: boolean;
  outcome?: ResolutionOutcome;
  reason: string;
  payload?: {
    resolvedBy: string;
    resolvedAt: string;
    adminNotes: string;
  };
}

@Injectable()
export class AdminEngine {
  private readonly logger = new Logger(AdminEngine.name);

  async checkReadyForManualReview(market: PredictionDocument): Promise<{
    ready: boolean;
    reason: string;
  }> {
    const cfg = market.resolution;
    
    if (!cfg || cfg.mode !== 'admin') {
      return {
        ready: false,
        reason: 'Market is not configured for admin resolution',
      };
    }

    // Check if close time has passed
    if (new Date() < new Date(market.closeTime)) {
      return {
        ready: false,
        reason: `Close time not reached: ${market.closeTime}`,
      };
    }

    return {
      ready: true,
      reason: 'Ready for manual admin resolution',
    };
  }

  async resolve(
    market: PredictionDocument,
    input: AdminResolveInput
  ): Promise<AdminResult> {
    const { outcome, reason, adminId } = input;

    if (!outcome || !['yes', 'no', 'invalid'].includes(outcome)) {
      return {
        success: false,
        reason: 'Invalid outcome. Must be yes, no, or invalid.',
      };
    }

    if (!reason || reason.length < 10) {
      return {
        success: false,
        reason: 'Resolution reason is required (minimum 10 characters)',
      };
    }

    this.logger.log(
      `Admin resolved market ${(market as any)._id}: ${outcome} - ${reason}`
    );

    return {
      success: true,
      outcome,
      reason,
      payload: {
        resolvedBy: adminId || 'admin',
        resolvedAt: new Date().toISOString(),
        adminNotes: reason,
      },
    };
  }

  getPlaceholderResult(): AdminResult {
    return {
      success: false,
      reason: 'Manual admin resolution required. Market is in manual_review status.',
    };
  }
}
