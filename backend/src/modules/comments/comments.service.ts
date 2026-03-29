import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './comments.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  async getComments(
    marketId: string,
    page = 1,
    limit = 20,
    sort: 'newest' | 'oldest' | 'popular' = 'newest',
  ) {
    const skip = (page - 1) * limit;

    let sortQuery: any = { createdAt: -1 };
    if (sort === 'oldest') sortQuery = { createdAt: 1 };
    if (sort === 'popular') sortQuery = { likes: -1, createdAt: -1 };

    const [comments, total] = await Promise.all([
      this.commentModel
        .find({ marketId, parentId: null, isDeleted: false })
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.commentModel.countDocuments({ marketId, parentId: null, isDeleted: false }),
    ]);

    return {
      data: comments.map(c => this.formatComment(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReplies(commentId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.commentModel
        .find({ parentId: commentId, isDeleted: false })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.commentModel.countDocuments({ parentId: commentId, isDeleted: false }),
    ]);

    return {
      data: replies.map(r => this.formatComment(r)),
      total,
      page,
      limit,
    };
  }

  async createComment(
    marketId: string,
    wallet: string,
    content: string,
    parentId?: string,
    userInfo?: { username?: string; avatar?: string },
  ) {
    // If replying, verify parent exists
    if (parentId) {
      const parent = await this.commentModel.findById(parentId);
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.commentModel.create({
      marketId,
      wallet: wallet.toLowerCase(),
      username: userInfo?.username || this.shortWallet(wallet),
      avatar: userInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${wallet}`,
      content,
      parentId: parentId || null,
    });

    // Update parent reply count
    if (parentId) {
      await this.commentModel.findByIdAndUpdate(parentId, {
        $inc: { repliesCount: 1 },
      });
    }

    return this.formatComment(comment.toObject());
  }

  async likeComment(commentId: string, wallet: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const walletLower = wallet.toLowerCase();
    const alreadyLiked = comment.likedBy.includes(walletLower);
    const alreadyDisliked = comment.dislikedBy.includes(walletLower);

    if (alreadyLiked) {
      // Remove like
      await this.commentModel.findByIdAndUpdate(commentId, {
        $pull: { likedBy: walletLower },
        $inc: { likes: -1 },
      });
      return { action: 'unliked' };
    }

    // Add like, remove dislike if exists
    const update: any = {
      $addToSet: { likedBy: walletLower },
      $inc: { likes: 1 },
    };
    
    if (alreadyDisliked) {
      update.$pull = { dislikedBy: walletLower };
      update.$inc.dislikes = -1;
    }

    await this.commentModel.findByIdAndUpdate(commentId, update);
    return { action: 'liked' };
  }

  async dislikeComment(commentId: string, wallet: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const walletLower = wallet.toLowerCase();
    const alreadyDisliked = comment.dislikedBy.includes(walletLower);
    const alreadyLiked = comment.likedBy.includes(walletLower);

    if (alreadyDisliked) {
      // Remove dislike
      await this.commentModel.findByIdAndUpdate(commentId, {
        $pull: { dislikedBy: walletLower },
        $inc: { dislikes: -1 },
      });
      return { action: 'undisliked' };
    }

    // Add dislike, remove like if exists
    const update: any = {
      $addToSet: { dislikedBy: walletLower },
      $inc: { dislikes: 1 },
    };
    
    if (alreadyLiked) {
      update.$pull = { likedBy: walletLower };
      update.$inc.likes = -1;
    }

    await this.commentModel.findByIdAndUpdate(commentId, update);
    return { action: 'disliked' };
  }

  async deleteComment(commentId: string, wallet: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    
    if (comment.wallet.toLowerCase() !== wallet.toLowerCase()) {
      throw new ForbiddenException('Not your comment');
    }

    await this.commentModel.findByIdAndUpdate(commentId, {
      isDeleted: true,
      content: '[deleted]',
    });

    // Update parent reply count if it's a reply
    if (comment.parentId) {
      await this.commentModel.findByIdAndUpdate(comment.parentId, {
        $inc: { repliesCount: -1 },
      });
    }

    return { success: true };
  }

  async getCommentsCount(marketId: string): Promise<number> {
    return this.commentModel.countDocuments({ marketId, isDeleted: false });
  }

  private formatComment(comment: any) {
    return {
      id: comment._id.toString(),
      marketId: comment.marketId,
      wallet: comment.wallet,
      username: comment.username,
      avatar: comment.avatar,
      content: comment.content,
      parentId: comment.parentId,
      likes: comment.likes,
      dislikes: comment.dislikes,
      repliesCount: comment.repliesCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  private shortWallet(wallet: string): string {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  }
}
