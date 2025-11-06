import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { Order } from '../schemas/order.schema';
import { OrderService } from '../services/order.service';
import { RecordService } from '../services/record.service';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly recordService: RecordService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order for a record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateOrderRequestDTO): Promise<Order> {
    const record = await this.recordService.findById(request.recordId);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    const orderData = {
      quantity: request.quantity,
      recordId: request.recordId,
    };

    this.logger.log(
      `Creating order with the following data: ${JSON.stringify(orderData)}`,
    );

    return this.orderService.createOrder(orderData);
  }
}
