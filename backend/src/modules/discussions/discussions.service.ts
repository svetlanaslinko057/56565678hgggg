import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discussion, DiscussionTopic, DiscussionComment } from './discussions.schema';

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectModel('Discussion') private discussionModel: Model<Discussion>,
    @InjectModel('DiscussionTopic') private topicModel: Model<DiscussionTopic>,
    @InjectModel('DiscussionComment') private commentModel: Model<DiscussionComment>,
    @InjectModel('ArenaUser') private userModel: Model<any>,
  ) {}

  // ===================== DISCUSSIONS =====================

  async getDiscussions(params: {
    page?: number;
    limit?: number;
    sort?: 'trending' | 'newest' | 'top_commented';
    tag?: string;
    wallet?: string;
  }) {
    const { page = 1, limit = 10, sort = 'trending', tag, wallet } = params;
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: { $ne: true } };
    if (tag) query.tags = tag;
    if (wallet) query.wallet = wallet.toLowerCase();

    let sortOption: any = { createdAt: -1 };
    if (sort === 'trending') sortOption = { votes: -1, commentsCount: -1 };
    else if (sort === 'top_commented') sortOption = { commentsCount: -1 };

    const [discussions, total] = await Promise.all([
      this.discussionModel.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      this.discussionModel.countDocuments(query),
    ]);

    return {
      data: discussions.map(d => ({
        id: (d as any)._id.toString(),
        ...d,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDiscussion(id: string) {
    const discussion = await this.discussionModel.findById(id).lean();
    if (!discussion) return null;

    // Increment views
    await this.discussionModel.updateOne({ _id: id }, { $inc: { views: 1 } });

    return {
      id: (discussion as any)._id.toString(),
      ...discussion,
      views: discussion.views + 1,
    };
  }

  async createDiscussion(data: {
    wallet: string;
    title: string;
    content?: string;
    tags?: string[];
    relatedMarketId?: string;
    relatedPositionId?: string;
  }) {
    const walletLower = data.wallet.toLowerCase();
    
    // Get user info
    const user = await this.userModel.findOne({ wallet: walletLower }).lean();
    const username = (user as any)?.username || `${walletLower.slice(0, 6)}...${walletLower.slice(-4)}`;
    const avatar = (user as any)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletLower}`;
    const followers = (user as any)?.followers || 0;

    const discussion = await this.discussionModel.create({
      wallet: walletLower,
      username,
      avatar,
      followers,
      title: data.title,
      content: data.content || '',
      tags: data.tags || [],
      relatedMarketId: data.relatedMarketId || null,
      relatedPositionId: data.relatedPositionId || null,
    });

    // Update topic counts
    if (data.tags && data.tags.length > 0) {
      await this.topicModel.updateMany(
        { name: { $in: data.tags } },
        { $inc: { postsCount: 1 } },
      );
    }

    return {
      id: (discussion as any)._id.toString(),
      ...discussion.toObject(),
    };
  }

  async voteDiscussion(id: string, wallet: string, type: 'up' | 'down') {
    const walletLower = wallet.toLowerCase();
    const discussion = await this.discussionModel.findById(id);
    if (!discussion) return null;

    const hasUpvoted = discussion.upvotedBy.includes(walletLower);
    const hasDownvoted = discussion.downvotedBy.includes(walletLower);

    const update: any = {};

    if (type === 'up') {
      if (hasUpvoted) {
        // Remove upvote
        update.$pull = { upvotedBy: walletLower };
        update.$inc = { votes: -1 };
      } else {
        // Add upvote, remove downvote if exists
        update.$addToSet = { upvotedBy: walletLower };
        update.$pull = { downvotedBy: walletLower };
        update.$inc = { votes: hasDownvoted ? 2 : 1 };
      }
    } else {
      if (hasDownvoted) {
        // Remove downvote
        update.$pull = { downvotedBy: walletLower };
        update.$inc = { votes: 1 };
      } else {
        // Add downvote, remove upvote if exists
        update.$addToSet = { downvotedBy: walletLower };
        update.$pull = { upvotedBy: walletLower };
        update.$inc = { votes: hasUpvoted ? -2 : -1 };
      }
    }

    const updated = await this.discussionModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return { id: (updated as any)._id.toString(), votes: updated?.votes };
  }

  // ===================== TOPICS =====================

  async getTopics() {
    const topics = await this.topicModel.find().sort({ postsCount: -1 }).lean();
    return topics.map(t => ({
      id: (t as any)._id.toString(),
      ...t,
    }));
  }

  async createTopic(name: string, color?: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const existing = await this.topicModel.findOne({ name });
    if (existing) return existing;

    const topic = await this.topicModel.create({ name, slug, color: color || '#3B82F6' });
    return { id: (topic as any)._id.toString(), ...topic.toObject() };
  }

  // ===================== COMMENTS =====================

  async getComments(discussionId: string, params: { page?: number; limit?: number; sort?: string }) {
    const { page = 1, limit = 20, sort = 'newest' } = params;
    const skip = (page - 1) * limit;

    const query = { discussionId, parentId: null, isDeleted: { $ne: true } };
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'popular') sortOption = { likes: -1 };

    const [comments, total] = await Promise.all([
      this.commentModel.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      this.commentModel.countDocuments(query),
    ]);

    return {
      data: comments.map(c => ({
        id: (c as any)._id.toString(),
        ...c,
      })),
      total,
    };
  }

  async getReplies(commentId: string) {
    const replies = await this.commentModel
      .find({ parentId: commentId, isDeleted: { $ne: true } })
      .sort({ createdAt: 1 })
      .lean();

    return replies.map(r => ({
      id: (r as any)._id.toString(),
      ...r,
    }));
  }

  async createComment(data: {
    discussionId: string;
    wallet: string;
    content: string;
    parentId?: string;
  }) {
    const walletLower = data.wallet.toLowerCase();
    
    const user = await this.userModel.findOne({ wallet: walletLower }).lean();
    const username = (user as any)?.username || `${walletLower.slice(0, 6)}...${walletLower.slice(-4)}`;
    const avatar = (user as any)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletLower}`;

    const comment = await this.commentModel.create({
      discussionId: data.discussionId,
      wallet: walletLower,
      username,
      avatar,
      content: data.content,
      parentId: data.parentId || null,
    });

    // Update counts
    await this.discussionModel.updateOne(
      { _id: data.discussionId },
      { $inc: { commentsCount: 1 } },
    );

    if (data.parentId) {
      await this.commentModel.updateOne(
        { _id: data.parentId },
        { $inc: { repliesCount: 1 } },
      );
    }

    // Update topic comment counts
    const discussion = await this.discussionModel.findById(data.discussionId).lean();
    if (discussion?.tags?.length > 0) {
      await this.topicModel.updateMany(
        { name: { $in: discussion.tags } },
        { $inc: { commentsCount: 1 } },
      );
    }

    return { id: (comment as any)._id.toString(), ...comment.toObject() };
  }

  async likeComment(commentId: string, wallet: string) {
    const walletLower = wallet.toLowerCase();
    const comment = await this.commentModel.findById(commentId);
    if (!comment) return null;

    if (comment.likedBy.includes(walletLower)) {
      await this.commentModel.updateOne(
        { _id: commentId },
        { $pull: { likedBy: walletLower }, $inc: { likes: -1 } },
      );
    } else {
      await this.commentModel.updateOne(
        { _id: commentId },
        { 
          $addToSet: { likedBy: walletLower }, 
          $pull: { dislikedBy: walletLower },
          $inc: { likes: 1, dislikes: comment.dislikedBy.includes(walletLower) ? -1 : 0 } 
        },
      );
    }

    const updated = await this.commentModel.findById(commentId).lean();
    return { likes: updated?.likes, dislikes: updated?.dislikes };
  }

  async dislikeComment(commentId: string, wallet: string) {
    const walletLower = wallet.toLowerCase();
    const comment = await this.commentModel.findById(commentId);
    if (!comment) return null;

    if (comment.dislikedBy.includes(walletLower)) {
      await this.commentModel.updateOne(
        { _id: commentId },
        { $pull: { dislikedBy: walletLower }, $inc: { dislikes: -1 } },
      );
    } else {
      await this.commentModel.updateOne(
        { _id: commentId },
        { 
          $addToSet: { dislikedBy: walletLower }, 
          $pull: { likedBy: walletLower },
          $inc: { dislikes: 1, likes: comment.likedBy.includes(walletLower) ? -1 : 0 } 
        },
      );
    }

    const updated = await this.commentModel.findById(commentId).lean();
    return { likes: updated?.likes, dislikes: updated?.dislikes };
  }

  // ===================== TOP CONTRIBUTORS =====================

  async getTopContributors(limit = 10) {
    const pipeline = [
      { $match: { isDeleted: { $ne: true } } },
      { $group: { 
        _id: '$wallet', 
        postsCount: { $sum: 1 },
        totalVotes: { $sum: '$votes' },
      }},
      { $sort: { totalVotes: -1, postsCount: -1 } as any },
      { $limit: limit },
    ];

    const topWallets = await this.discussionModel.aggregate(pipeline);
    
    // Get user details
    const wallets = topWallets.map(w => w._id);
    const users = await this.userModel.find({ wallet: { $in: wallets } }).lean();
    const userMap = new Map(users.map(u => [(u as any).wallet, u]));

    // Get comment counts
    const commentCounts = await this.commentModel.aggregate([
      { $match: { wallet: { $in: wallets }, isDeleted: { $ne: true } } },
      { $group: { _id: '$wallet', count: { $sum: 1 } } },
    ]);
    const commentMap = new Map(commentCounts.map(c => [c._id, c.count]));

    return topWallets.map(w => {
      const user = userMap.get(w._id) as any;
      return {
        wallet: w._id,
        username: user?.username || `${w._id.slice(0, 6)}...${w._id.slice(-4)}`,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w._id}`,
        tier: user?.tier || 'Bronze',
        xp: user?.xp || 0,
        upvotes: w.totalVotes,
        comments: commentMap.get(w._id) || 0,
        engagement: Math.round((w.totalVotes + (commentMap.get(w._id) || 0)) * 3.2) / 10,
      };
    });
  }

  // ===================== STATS =====================

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newTopics, newPosts, commentsPosted, discussions] = await Promise.all([
      this.topicModel.countDocuments({ createdAt: { $gte: today } }),
      this.discussionModel.countDocuments({ createdAt: { $gte: today } }),
      this.commentModel.countDocuments({ createdAt: { $gte: today } }),
      this.discussionModel.find({ createdAt: { $gte: today } }).lean(),
    ]);

    const upvotesGiven = discussions.reduce((sum, d) => sum + (d.upvotedBy?.length || 0), 0);
    const activeUsers = new Set([
      ...discussions.map(d => d.wallet),
    ]).size;

    // Most active tag
    const tagCounts: Record<string, number> = {};
    discussions.forEach(d => {
      d.tags?.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    const mostActiveTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Analytics';

    // Top contributor today
    const topContributor = await this.discussionModel.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: '$wallet', count: { $sum: 1 } } },
      { $sort: { count: -1 } as any },
      { $limit: 1 },
    ]);
    
    let topContributorInfo = { username: 'N/A', xpEarned: 0 };
    if (topContributor.length > 0) {
      const user = await this.userModel.findOne({ wallet: topContributor[0]._id }).lean();
      topContributorInfo = {
        username: (user as any)?.username || `${topContributor[0]._id.slice(0, 6)}...`,
        xpEarned: topContributor[0].count * 25,
      };
    }

    return {
      newTopics,
      newPosts,
      commentsPosted,
      upvotesGiven,
      activeUsers,
      mostActiveTag,
      topContributor: topContributorInfo,
    };
  }

  // Seed default topics
  async seedTopics() {
    const defaultTopics = [
      { name: 'Blockchain', color: '#3B82F6' },
      { name: 'NFTs', color: '#8B5CF6' },
      { name: 'DeFi', color: '#10B981' },
      { name: 'AI', color: '#F59E0B' },
      { name: 'Analytics', color: '#06B6D4' },
      { name: 'Strategy', color: '#EF4444' },
      { name: 'Invests', color: '#84CC16' },
      { name: 'Market', color: '#EC4899' },
      { name: 'Airdrops', color: '#F97316' },
      { name: 'Scam', color: '#DC2626' },
    ];

    for (const topic of defaultTopics) {
      await this.topicModel.updateOne(
        { name: topic.name },
        { $setOnInsert: { ...topic, slug: topic.name.toLowerCase(), postsCount: 0, commentsCount: 0 } },
        { upsert: true },
      );
    }
  }
}
