import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RecordFormat, RecordCategory } from './record.enum';

@Schema({ timestamps: true })
export class Record extends Document {
  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ enum: RecordFormat, required: true })
  format: RecordFormat;

  @Prop({ enum: RecordCategory, required: true })
  category: RecordCategory;

  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: Date.now })
  lastModified: Date;

  @Prop({ required: false })
  mbid?: string;

  // NEW
  @Prop({ type: [String], default: [] })
  tracklist: string[];
}

export const RecordSchema = SchemaFactory.createForClass(Record);

// Core filter indexes (these match your GET /records filters)
RecordSchema.index({ format: 1 });
RecordSchema.index({ category: 1 });
RecordSchema.index({ artist: 1 });
RecordSchema.index({ album: 1 });

// Composite index for common filter combos + stable pagination
RecordSchema.index({ format: 1, category: 1, _id: 1 });

// Text search index for q ($text search)
RecordSchema.index({ artist: 'text', album: 'text', category: 'text' });
// Unique identity: artist + album + format
RecordSchema.index({ artist: 1, album: 1, format: 1 }, { unique: true });
