import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
  ) {}

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    return this.orderModel.create(orderData);
  }
}
