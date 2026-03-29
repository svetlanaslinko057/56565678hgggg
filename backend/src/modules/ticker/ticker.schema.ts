import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TickerItemDocument = TickerItem & Document;

@Schema({ timestamps: true, collection: 'ticker_items' })
export class TickerItem {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  icon: string; // SVG icon name: fire, volume, target, users, trophy, chart, clock, star, flame

  @Prop({ required: true })
  color: string; // Icon color hex

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ default: null })
  value: string; // Static value or null for dynamic

  @Prop({ default: null })
  changeValue: string; // Change indicator like +12% or +89

  @Prop({ default: true })
  changePositive: boolean;

  @Prop({ default: false })
  isDynamic: boolean; // If true, value is fetched from stats

  @Prop({ default: null })
  dynamicSource: string; // Source for dynamic value: activeMarkets, totalVolume, totalBets, etc.
}

export const TickerItemSchema = SchemaFactory.createForClass(TickerItem);
