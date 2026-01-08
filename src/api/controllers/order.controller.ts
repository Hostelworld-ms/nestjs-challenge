import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Order } from '../schemas/order.schema';
import { Record } from '../schemas/record.schema';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new order and decrement stock atomically',
  })
  @ApiResponse({
    status: 201,
    description: 'Order successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (bad recordId or quantity)',
  })
  @ApiResponse({
    status: 409,
    description: 'Insufficient stock for the requested quantity',
  })
  async create(@Body() body: CreateOrderRequestDTO) {
    const { recordId, quantity } = body;

    if (!Types.ObjectId.isValid(recordId)) {
      throw new BadRequestException('Invalid recordId');
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    // ATOMIC: only decrement if qty >= quantity
    const updatedRecord = await this.recordModel.findOneAndUpdate(
      { _id: recordId, qty: { $gte: quantity } },
      { $inc: { qty: -quantity } },
      { new: true },
    );

    if (!updatedRecord) {
      throw new ConflictException('Insufficient stock');
    }

    const order = await this.orderModel.create({
      recordId: new Types.ObjectId(recordId),
      quantity,
    });

    return {
      orderId: order._id,
      recordId,
      quantity,
      remainingStock: updatedRecord.qty,
    };
  }
}
