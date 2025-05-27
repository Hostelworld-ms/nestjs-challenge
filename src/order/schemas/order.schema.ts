import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';
import { Types } from 'mongoose';
import { OrderStatus } from '../types/order.types';

@Schema({ timestamps: true })
export class Order extends AbstractDocument {
  @Prop({ type: Types.ObjectId, ref: 'Record', required: true })
  recordId: Types.ObjectId;

  @Prop({ required: true })
  qty: number;

  @Prop({
    default: OrderStatus.PENDING,
    enum: OrderStatus,
    type: String,
    required: true,
  })
  status: OrderStatus;

  @Prop({ default: Date.now })
  created: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
