import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Record' })
  recordId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
