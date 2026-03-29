import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ABTestingService } from './ab-testing.service';

@ApiTags('A/B Testing')
@Controller('ab')
export class ABTestingController {
  constructor(private readonly abService: ABTestingService) {}

  @Get('tests')
  @ApiOperation({ summary: 'Get all A/B tests' })
  async getTests() {
    const tests = await this.abService.getActiveTests();
    return { success: true, data: tests };
  }

  @Get('variant/:testId/:userId')
  @ApiOperation({ summary: 'Get variant for user in a test' })
  @ApiParam({ name: 'testId', description: 'Test ID' })
  @ApiParam({ name: 'userId', description: 'User ID (wallet or telegramId)' })
  async getVariant(
    @Param('testId') testId: string,
    @Param('userId') userId: string,
  ) {
    const variant = await this.abService.getVariant(testId, userId);
    return { success: true, data: variant };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all variants for a user across tests' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserVariants(@Param('userId') userId: string) {
    const variants = await this.abService.getUserVariants(userId);
    return { success: true, data: variants };
  }

  @Post('track')
  @ApiOperation({ summary: 'Track conversion event' })
  async trackEvent(
    @Body() body: {
      testId: string;
      userId: string;
      event: string;
      value?: number;
    },
  ) {
    await this.abService.trackEvent({
      testId: body.testId,
      oduleId: body.userId,
      event: body.event,
      value: body.value,
    });
    return { success: true };
  }

  @Post('track-action')
  @ApiOperation({ summary: 'Track user action across all enrolled tests' })
  async trackAction(
    @Body() body: {
      userId: string;
      action: string;
      value?: number;
    },
  ) {
    await this.abService.trackUserAction(body.userId, body.action, body.value);
    return { success: true };
  }

  @Get('results/:testId')
  @ApiOperation({ summary: 'Get test results with statistics' })
  @ApiParam({ name: 'testId', description: 'Test ID' })
  async getResults(@Param('testId') testId: string) {
    const results = await this.abService.getResults(testId);
    return { success: true, data: results };
  }

  @Get('results')
  @ApiOperation({ summary: 'Get all test results' })
  async getAllResults() {
    const results = await this.abService.getAllResults();
    return { success: true, data: results };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get A/B testing dashboard data' })
  async getDashboard() {
    const results = await this.abService.getAllResults();
    
    const dashboard = {
      totalTests: results.length,
      runningTests: results.filter(r => r.status === 'running').length,
      completedTests: results.filter(r => r.status === 'completed').length,
      totalAssignments: results.reduce((sum, r) => sum + r.totalAssignments, 0),
      testsWithWinner: results.filter(r => r.winner).length,
      tests: results.map(r => ({
        id: r.testId,
        name: r.testName,
        status: r.status,
        assignments: r.totalAssignments,
        winner: r.winner,
        confidence: r.confidence,
        significant: r.significantDifference,
        variants: r.variants.map(v => ({
          id: v.id,
          name: v.name,
          assignments: v.assignments,
          conversionRate: Math.round(v.conversionRate * 10) / 10,
        })),
      })),
    };
    
    return { success: true, data: dashboard };
  }

  @Post('complete/:testId')
  @ApiOperation({ summary: 'Complete a test' })
  @ApiParam({ name: 'testId', description: 'Test ID' })
  async completeTest(@Param('testId') testId: string) {
    await this.abService.completeTest(testId);
    return { success: true };
  }
}
