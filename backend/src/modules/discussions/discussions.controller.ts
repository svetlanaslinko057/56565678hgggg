import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DiscussionsService } from './discussions.service';
import { AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('discussions')
@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  /**
   * Get discussions list
   * GET /api/discussions
   */
  @Get()
  @ApiOperation({ summary: 'Get discussions list' })
  async getDiscussions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'trending' | 'newest' | 'top_commented',
    @Query('tag') tag?: string,
    @Query('wallet') wallet?: string,
  ) {
    const result = await this.discussionsService.getDiscussions({
      page: parseInt(page || '1'),
      limit: parseInt(limit || '10'),
      sort: sort || 'trending',
      tag,
      wallet,
    });

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get single discussion
   * GET /api/discussions/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get discussion by ID' })
  async getDiscussion(@Param('id') id: string) {
    const discussion = await this.discussionsService.getDiscussion(id);
    if (!discussion) {
      return ApiResponse.error('Discussion not found', 404);
    }
    return ApiResponse.success(discussion);
  }

  /**
   * Create new discussion
   * POST /api/discussions
   */
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new discussion' })
  async createDiscussion(
    @Req() req: any,
    @Body() body: {
      title: string;
      content?: string;
      tags?: string[];
      relatedMarketId?: string;
      relatedPositionId?: string;
    },
  ) {
    if (!body.title?.trim()) {
      throw new HttpException('Title is required', HttpStatus.BAD_REQUEST);
    }

    const discussion = await this.discussionsService.createDiscussion({
      wallet: req.user.wallet,
      ...body,
    });

    return ApiResponse.success(discussion, 'Discussion created successfully');
  }

  /**
   * Vote on discussion
   * POST /api/discussions/:id/vote
   */
  @Post(':id/vote')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Vote on discussion' })
  async voteDiscussion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { type: 'up' | 'down' },
  ) {
    const result = await this.discussionsService.voteDiscussion(id, req.user.wallet, body.type);
    if (!result) {
      return ApiResponse.error('Discussion not found', 404);
    }
    return ApiResponse.success(result);
  }

  /**
   * Get topics
   * GET /api/discussions/topics/list
   */
  @Get('topics/list')
  @ApiOperation({ summary: 'Get all topics' })
  async getTopics() {
    const topics = await this.discussionsService.getTopics();
    return ApiResponse.success(topics);
  }

  /**
   * Create topic
   * POST /api/discussions/topics
   */
  @Post('topics')
  @UseGuards(AuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new topic' })
  async createTopic(@Body() body: { name: string; color?: string }) {
    if (!body.name?.trim()) {
      return ApiResponse.error('Topic name is required', 400);
    }
    const topic = await this.discussionsService.createTopic(body.name, body.color);
    return ApiResponse.success(topic);
  }

  /**
   * Get discussion comments
   * GET /api/discussions/:id/comments
   */
  @Get(':id/comments')
  @ApiOperation({ summary: 'Get discussion comments' })
  async getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.discussionsService.getComments(id, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
      sort,
    });
    return { success: true, ...result };
  }

  /**
   * Get comment replies
   * GET /api/discussions/comments/:commentId/replies
   */
  @Get('comments/:commentId/replies')
  @ApiOperation({ summary: 'Get comment replies' })
  async getReplies(@Param('commentId') commentId: string) {
    const replies = await this.discussionsService.getReplies(commentId);
    return ApiResponse.success(replies);
  }

  /**
   * Create comment
   * POST /api/discussions/:id/comments
   */
  @Post(':id/comments')
  @UseGuards(AuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create comment on discussion' })
  async createComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    if (!body.content?.trim()) {
      return ApiResponse.error('Content is required', 400);
    }

    const comment = await this.discussionsService.createComment({
      discussionId: id,
      wallet: req.user.wallet,
      content: body.content,
      parentId: body.parentId,
    });

    return ApiResponse.success(comment, 'Comment created successfully');
  }

  /**
   * Like comment
   * POST /api/discussions/comments/:commentId/like
   */
  @Post('comments/:commentId/like')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Like comment' })
  async likeComment(@Req() req: any, @Param('commentId') commentId: string) {
    const result = await this.discussionsService.likeComment(commentId, req.user.wallet);
    if (!result) {
      return ApiResponse.error('Comment not found', 404);
    }
    return ApiResponse.success(result);
  }

  /**
   * Dislike comment
   * POST /api/discussions/comments/:commentId/dislike
   */
  @Post('comments/:commentId/dislike')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Dislike comment' })
  async dislikeComment(@Req() req: any, @Param('commentId') commentId: string) {
    const result = await this.discussionsService.dislikeComment(commentId, req.user.wallet);
    if (!result) {
      return ApiResponse.error('Comment not found', 404);
    }
    return ApiResponse.success(result);
  }

  /**
   * Get top contributors
   * GET /api/discussions/contributors/top
   */
  @Get('contributors/top')
  @ApiOperation({ summary: 'Get top contributors' })
  async getTopContributors(@Query('limit') limit?: string) {
    const contributors = await this.discussionsService.getTopContributors(parseInt(limit || '10'));
    return ApiResponse.success(contributors);
  }

  /**
   * Get today stats
   * GET /api/discussions/stats/today
   */
  @Get('stats/today')
  @ApiOperation({ summary: 'Get today discussion stats' })
  async getTodayStats() {
    const stats = await this.discussionsService.getTodayStats();
    return ApiResponse.success(stats);
  }

  /**
   * Seed default topics
   * POST /api/discussions/seed
   */
  @Post('seed')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seed default topics' })
  async seedTopics() {
    await this.discussionsService.seedTopics();
    return ApiResponse.success(null, 'Topics seeded successfully');
  }
}
