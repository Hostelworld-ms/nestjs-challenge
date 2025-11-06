import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, ref: 'Record' })
  recordId: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
