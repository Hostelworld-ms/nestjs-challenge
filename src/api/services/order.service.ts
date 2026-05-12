import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { Order } from '../schemas/order.schema';
import { Record } from '../schemas/record.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async createOrder(payload: CreateOrderRequestDTO): Promise<Order> {
    const recordId = new Types.ObjectId(payload.recordId);
    const quantity = payload.quantity;

    const record = await this.recordModel.findById(recordId).exec();
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    if (record.qty < quantity) {
      throw new BadRequestException('Not enough stock for this order');
    }

    const updatedRecord = await this.recordModel
      .findOneAndUpdate(
        { _id: recordId, qty: { $gte: quantity } },
        { $inc: { qty: -quantity } },
        { new: true },
      )
      .exec();

    if (!updatedRecord) {
      throw new BadRequestException('Not enough stock for this order');
    }

    const unitPrice = record.price;
    const totalPrice = unitPrice * quantity;

    return this.orderModel.create({
      recordId,
      quantity,
      unitPrice,
      totalPrice,
    });
  }
}
