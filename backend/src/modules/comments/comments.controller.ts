import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('market/:marketId')
  @ApiOperation({ summary: 'Get comments for a market' })
  async getComments(
    @Param('marketId') marketId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'newest' | 'oldest' | 'popular',
  ) {
    const result = await this.commentsService.getComments(
      marketId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      sort || 'newest',
    );
    return { success: true, ...result };
  }

  @Get(':commentId/replies')
  @ApiOperation({ summary: 'Get replies to a comment' })
  async getReplies(
    @Param('commentId') commentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.commentsService.getReplies(
      commentId,
      parseInt(page || '1'),
      parseInt(limit || '10'),
    );
    return { success: true, ...result };
  }

  @Post('market/:marketId')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a comment' })
  async createComment(
    @Param('marketId') marketId: string,
    @Body() body: { content: string; parentId?: string },
    @Headers('x-wallet-address') wallet: string,
  ) {
    if (!wallet) {
      return { success: false, error: 'Wallet address required' };
    }
    
    const comment = await this.commentsService.createComment(
      marketId,
      wallet,
      body.content,
      body.parentId,
    );
    return { success: true, data: comment };
  }

  @Post(':commentId/like')
  @HttpCode(200)
  @ApiOperation({ summary: 'Like a comment' })
  async likeComment(
    @Param('commentId') commentId: string,
    @Headers('x-wallet-address') wallet: string,
  ) {
    if (!wallet) {
      return { success: false, error: 'Wallet address required' };
    }
    
    const result = await this.commentsService.likeComment(commentId, wallet);
    return { success: true, ...result };
  }

  @Post(':commentId/dislike')
  @HttpCode(200)
  @ApiOperation({ summary: 'Dislike a comment' })
  async dislikeComment(
    @Param('commentId') commentId: string,
    @Headers('x-wallet-address') wallet: string,
  ) {
    if (!wallet) {
      return { success: false, error: 'Wallet address required' };
    }
    
    const result = await this.commentsService.dislikeComment(commentId, wallet);
    return { success: true, ...result };
  }

  @Delete(':commentId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Headers('x-wallet-address') wallet: string,
  ) {
    if (!wallet) {
      return { success: false, error: 'Wallet address required' };
    }
    
    const result = await this.commentsService.deleteComment(commentId, wallet);
    return { success: true, ...result };
  }

  @Get('market/:marketId/count')
  @ApiOperation({ summary: 'Get comments count for a market' })
  async getCommentsCount(@Param('marketId') marketId: string) {
    const count = await this.commentsService.getCommentsCount(marketId);
    return { success: true, count };
  }
}
