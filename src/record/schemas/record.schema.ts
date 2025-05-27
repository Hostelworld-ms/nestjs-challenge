import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';
import { RecordFormat, RecordCategory, TrackList } from '../types/record.types';

@Schema({ timestamps: true })
export class Record extends AbstractDocument {
  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ enum: RecordFormat, type: String, required: true })
  format: RecordFormat;

  @Prop({ enum: RecordCategory, type: String, required: true })
  category: RecordCategory;

  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: Date.now })
  lastModified?: Date;

  @Prop({ required: false })
  mbid?: string;

  @Prop({ required: false })
  trackList?: TrackList[];
}

export const RecordSchema = SchemaFactory.createForClass(Record);

RecordSchema.index({ artist: 1 }, { collation: { locale: 'en', strength: 2 } });
RecordSchema.index({ album: 1 }, { collation: { locale: 'en', strength: 2 } });
RecordSchema.index({ format: 1 }, { collation: { locale: 'en', strength: 2 } });
RecordSchema.index(
  { category: 1 },
  { collation: { locale: 'en', strength: 2 } },
);
