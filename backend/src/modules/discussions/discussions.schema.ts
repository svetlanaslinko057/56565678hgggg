import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DiscussionDocument = Discussion & Document;

@Schema({ timestamps: true, collection: 'discussions' })
export class Discussion {
  @Prop({ required: true })
  wallet: string;

  @Prop()
  username: string;

  @Prop()
  avatar: string;

  @Prop({ default: 0 })
  followers: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  content: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  votes: number;

  @Prop({ type: [String], default: [] })
  upvotedBy: string[];

  @Prop({ type: [String], default: [] })
  downvotedBy: string[];

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  views: number;

  @Prop({ type: String, default: null })
  relatedMarketId: string | null;

  @Prop({ type: String, default: null })
  relatedPositionId: string | null;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DiscussionSchema = SchemaFactory.createForClass(Discussion);

// Indexes
DiscussionSchema.index({ createdAt: -1 });
DiscussionSchema.index({ votes: -1 });
DiscussionSchema.index({ commentsCount: -1 });
DiscussionSchema.index({ tags: 1 });
DiscussionSchema.index({ wallet: 1 });
DiscussionSchema.index({ relatedMarketId: 1 });

// Topic/Tag schema
@Schema({ timestamps: true, collection: 'discussion_topics' })
export class DiscussionTopic {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  slug: string;

  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: '#3B82F6' })
  color: string;

  @Prop()
  icon: string;
}

export const DiscussionTopicSchema = SchemaFactory.createForClass(DiscussionTopic);
DiscussionTopicSchema.index({ name: 1 });
DiscussionTopicSchema.index({ postsCount: -1 });

// Discussion Comment schema
@Schema({ timestamps: true, collection: 'discussion_comments' })
export class DiscussionComment {
  @Prop({ required: true })
  discussionId: string;

  @Prop({ required: true })
  wallet: string;

  @Prop()
  username: string;

  @Prop()
  avatar: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, default: null })
  parentId: string | null;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  dislikes: number;

  @Prop({ type: [String], default: [] })
  likedBy: string[];

  @Prop({ type: [String], default: [] })
  dislikedBy: string[];

  @Prop({ default: 0 })
  repliesCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;
}

export const DiscussionCommentSchema = SchemaFactory.createForClass(DiscussionComment);
DiscussionCommentSchema.index({ discussionId: 1, createdAt: -1 });
DiscussionCommentSchema.index({ parentId: 1 });
