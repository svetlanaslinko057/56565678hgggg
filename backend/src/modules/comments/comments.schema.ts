import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'comments' })
export class Comment extends Document {
  @Prop({ required: true })
  marketId: string;

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

  @Prop()
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes
CommentSchema.index({ marketId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ wallet: 1 });
