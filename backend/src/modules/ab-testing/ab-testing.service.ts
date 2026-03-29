import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * A/B Test Configuration
 */
export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    id: string;
    name: string;
    weight: number; // % of traffic (e.g., 50)
    config: Record<string, any>;
  }[];
  targetSize: number; // Target sample size per variant
  metrics: string[]; // Metrics to track
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

export interface ABAssignment {
  odule: string;
  testId: string;
  oduleId: string;
  variantId: string;
  assignedAt: Date;
  converted: boolean;
  conversionEvents: {
    event: string;
    value?: number;
    timestamp: Date;
  }[];
}

export interface ABResults {
  testId: string;
  testName: string;
  status: string;
  totalAssignments: number;
  variants: {
    id: string;
    name: string;
    assignments: number;
    conversions: number;
    conversionRate: number;
    totalValue: number;
    avgValue: number;
    events: Record<string, number>;
  }[];
  winner?: string;
  confidence?: number;
  significantDifference: boolean;
}

/**
 * A/B Testing Service
 * 
 * Features:
 * - User assignment to test variants
 * - Event tracking (bet_placed, win, share, return)
 * - Statistical analysis
 * - Results dashboard
 */
@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);
  
  // Pre-configured tests for FOMO Arena
  private readonly ACTIVE_TESTS: ABTest[] = [
    {
      id: 'fomo_message_v1',
      name: 'FOMO Message Style',
      description: 'Test aggressive vs subtle FOMO messaging',
      status: 'running',
      variants: [
        {
          id: 'aggressive',
          name: 'Aggressive FOMO',
          weight: 50,
          config: {
            urgencyLevel: 'high',
            showWhaleAlerts: true,
            showCountdown: true,
            ctaText: '🔥 BET NOW - LIMITED TIME',
            messageStyle: 'urgent',
          },
        },
        {
          id: 'subtle',
          name: 'Subtle FOMO',
          weight: 50,
          config: {
            urgencyLevel: 'low',
            showWhaleAlerts: false,
            showCountdown: false,
            ctaText: 'Place Bet',
            messageStyle: 'calm',
          },
        },
      ],
      targetSize: 1000,
      metrics: ['bet_placed', 'bet_amount', 'return_d1', 'share'],
      startedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: 'win_card_v1',
      name: 'Win Card Design',
      description: 'Test enhanced vs minimal win cards',
      status: 'running',
      variants: [
        {
          id: 'enhanced',
          name: 'Enhanced (Badges, Achievements)',
          weight: 50,
          config: {
            showBadges: true,
            showAchievements: true,
            showStreak: true,
            showRivalBeaten: true,
            animatedGlow: true,
          },
        },
        {
          id: 'minimal',
          name: 'Minimal (Just Profit)',
          weight: 50,
          config: {
            showBadges: false,
            showAchievements: false,
            showStreak: false,
            showRivalBeaten: false,
            animatedGlow: false,
          },
        },
      ],
      targetSize: 1000,
      metrics: ['share_rate', 'referral_click', 'return_d1'],
      startedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: 'rival_pressure_v1',
      name: 'Rival Pressure Intensity',
      description: 'Test high vs low pressure rival notifications',
      status: 'running',
      variants: [
        {
          id: 'high_pressure',
          name: 'High Pressure',
          weight: 50,
          config: {
            notifyAfterLosses: 2,
            showEmojis: true,
            aggressiveText: true,
            sendPush: true,
            pushFrequency: 'immediate',
          },
        },
        {
          id: 'low_pressure',
          name: 'Low Pressure',
          weight: 50,
          config: {
            notifyAfterLosses: 4,
            showEmojis: false,
            aggressiveText: false,
            sendPush: true,
            pushFrequency: 'daily',
          },
        },
      ],
      targetSize: 1000,
      metrics: ['duel_accepted', 'rematch_rate', 'return_d1'],
      startedAt: new Date(),
      createdAt: new Date(),
    },
  ];

  constructor(
    @InjectConnection() private connection: Connection,
  ) {
    this.logger.log('A/B Testing Service initialized');
    this.initializeTests();
  }

  private get testsCollection() {
    return this.connection.collection('ab_tests');
  }

  private get assignmentsCollection() {
    return this.connection.collection('ab_assignments');
  }

  private get eventsCollection() {
    return this.connection.collection('ab_events');
  }

  /**
   * Initialize active tests in DB
   */
  private async initializeTests() {
    for (const test of this.ACTIVE_TESTS) {
      await this.testsCollection.updateOne(
        { id: test.id },
        { $setOnInsert: test },
        { upsert: true }
      );
    }
    this.logger.log(`Initialized ${this.ACTIVE_TESTS.length} A/B tests`);
  }

  /**
   * Get variant for user (deterministic assignment)
   */
  async getVariant(testId: string, oduleId: string): Promise<{
    variantId: string;
    config: Record<string, any>;
  } | null> {
    // Check existing assignment
    const existing = await this.assignmentsCollection.findOne({
      testId,
      oduleId,
    });

    if (existing) {
      const test = await this.testsCollection.findOne({ id: testId });
      const variant = test?.variants?.find((v: any) => v.id === existing.variantId);
      return variant ? { variantId: variant.id, config: variant.config } : null;
    }

    // Get test
    const test = await this.testsCollection.findOne({ id: testId, status: 'running' });
    if (!test) return null;

    // Check if test has reached target size
    const totalAssignments = await this.assignmentsCollection.countDocuments({ testId });
    if (totalAssignments >= test.targetSize * test.variants.length) {
      this.logger.log(`Test ${testId} reached target size`);
      return null;
    }

    // Assign variant based on weights
    const variant = this.selectVariant(test.variants, oduleId);
    
    // Save assignment
    await this.assignmentsCollection.insertOne({
      testId,
      oduleId,
      variantId: variant.id,
      assignedAt: new Date(),
      converted: false,
      conversionEvents: [],
    });

    this.logger.log(`Assigned ${oduleId} to variant ${variant.id} in test ${testId}`);

    return { variantId: variant.id, config: variant.config };
  }

  /**
   * Select variant based on weights (deterministic by oduleId)
   */
  private selectVariant(variants: ABTest['variants'], oduleId: string): ABTest['variants'][0] {
    // Create deterministic hash from oduleId
    let hash = 0;
    for (let i = 0; i < oduleId.length; i++) {
      const char = oduleId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const normalizedHash = Math.abs(hash) % 100;
    
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (normalizedHash < cumulative) {
        return variant;
      }
    }
    
    return variants[variants.length - 1];
  }

  /**
   * Track conversion event
   */
  async trackEvent(params: {
    testId: string;
    oduleId: string;
    event: string;
    value?: number;
  }): Promise<void> {
    const { testId, oduleId, event, value } = params;

    const eventData = {
      event,
      value: value || 1,
      timestamp: new Date(),
    };

    // Update assignment with event using raw MongoDB operation
    await this.assignmentsCollection.updateOne(
      { testId, oduleId },
      {
        $set: { converted: true },
        $push: {
          conversionEvents: eventData,
        } as any,
      }
    );

    // Store detailed event
    await this.eventsCollection.insertOne({
      testId,
      oduleId,
      event,
      value: value || 1,
      timestamp: new Date(),
    });

    this.logger.log(`Tracked event ${event} for ${oduleId} in test ${testId}`);
  }

  /**
   * Track user action (convenience method)
   */
  async trackUserAction(oduleId: string, action: string, value?: number): Promise<void> {
    // Track across all active tests user is enrolled in
    const assignments = await this.assignmentsCollection.find({ oduleId }).toArray();
    
    for (const assignment of assignments) {
      await this.trackEvent({
        testId: assignment.testId,
        oduleId,
        event: action,
        value,
      });
    }
  }

  /**
   * Get test results with statistics
   */
  async getResults(testId: string): Promise<ABResults> {
    const test = await this.testsCollection.findOne({ id: testId });
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const variantResults = [];

    for (const variant of test.variants) {
      const assignments = await this.assignmentsCollection.countDocuments({
        testId,
        variantId: variant.id,
      });

      const conversions = await this.assignmentsCollection.countDocuments({
        testId,
        variantId: variant.id,
        converted: true,
      });

      // Get all events for this variant
      const events = await this.eventsCollection.aggregate([
        {
          $match: { testId },
        },
        {
          $lookup: {
            from: 'ab_assignments',
            localField: 'oduleId',
            foreignField: 'oduleId',
            as: 'assignment',
          },
        },
        {
          $match: {
            'assignment.variantId': variant.id,
          },
        },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' },
          },
        },
      ]).toArray();

      const eventMap: Record<string, number> = {};
      let totalValue = 0;
      
      for (const e of events) {
        eventMap[e._id] = e.count;
        totalValue += e.totalValue || 0;
      }

      variantResults.push({
        id: variant.id,
        name: variant.name,
        assignments,
        conversions,
        conversionRate: assignments > 0 ? (conversions / assignments) * 100 : 0,
        totalValue,
        avgValue: conversions > 0 ? totalValue / conversions : 0,
        events: eventMap,
      });
    }

    // Calculate winner and significance
    const sorted = [...variantResults].sort((a, b) => b.conversionRate - a.conversionRate);
    const winner = sorted[0];
    const runnerUp = sorted[1];

    // Simple significance check (Z-test approximation)
    let significantDifference = false;
    let confidence = 0;

    if (winner && runnerUp && winner.assignments >= 100 && runnerUp.assignments >= 100) {
      const p1 = winner.conversionRate / 100;
      const p2 = runnerUp.conversionRate / 100;
      const n1 = winner.assignments;
      const n2 = runnerUp.assignments;
      
      const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
      const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
      const z = se > 0 ? Math.abs(p1 - p2) / se : 0;
      
      // Z > 1.96 = 95% confidence
      significantDifference = z > 1.96;
      confidence = Math.min(99.9, (1 - 2 * (1 - this.normalCDF(z))) * 100);
    }

    return {
      testId,
      testName: test.name,
      status: test.status,
      totalAssignments: variantResults.reduce((sum, v) => sum + v.assignments, 0),
      variants: variantResults,
      winner: significantDifference ? winner?.id : undefined,
      confidence: Math.round(confidence * 10) / 10,
      significantDifference,
    };
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(z: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Get all active tests
   */
  async getActiveTests(): Promise<ABTest[]> {
    return this.testsCollection.find({ status: 'running' }).toArray() as unknown as ABTest[];
  }

  /**
   * Get all test results summary
   */
  async getAllResults(): Promise<ABResults[]> {
    const tests = await this.testsCollection.find({}).toArray();
    const results = [];
    
    for (const test of tests) {
      try {
        const result = await this.getResults(test.id);
        results.push(result);
      } catch (e) {
        this.logger.error(`Error getting results for test ${test.id}: ${e}`);
      }
    }
    
    return results;
  }

  /**
   * Get user's variants across all tests
   */
  async getUserVariants(oduleId: string): Promise<Record<string, { variantId: string; config: Record<string, any> }>> {
    const result: Record<string, { variantId: string; config: Record<string, any> }> = {};
    
    const activeTests = await this.getActiveTests();
    
    for (const test of activeTests) {
      const variant = await this.getVariant(test.id, oduleId);
      if (variant) {
        result[test.id] = variant;
      }
    }
    
    return result;
  }

  /**
   * Complete a test
   */
  async completeTest(testId: string): Promise<void> {
    await this.testsCollection.updateOne(
      { id: testId },
      { 
        $set: { 
          status: 'completed',
          endedAt: new Date(),
        } 
      }
    );
    this.logger.log(`Test ${testId} completed`);
  }

  /**
   * Cron: Auto-complete tests that reached target
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkTestCompletion(): Promise<void> {
    const runningTests = await this.testsCollection.find({ status: 'running' }).toArray();
    
    for (const test of runningTests) {
      const totalAssignments = await this.assignmentsCollection.countDocuments({ testId: test.id });
      const targetTotal = test.targetSize * test.variants.length;
      
      if (totalAssignments >= targetTotal) {
        await this.completeTest(test.id);
        this.logger.log(`Test ${test.id} auto-completed: ${totalAssignments}/${targetTotal} assignments`);
      }
    }
  }
}
