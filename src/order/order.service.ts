// order.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Connection } from 'mongoose';
import { Order } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { RecordRepository } from 'src/record/record.repository';
import { OrderRepository } from './order.repository';
import { OrderStatus } from './types/order.types';
import { ClientProxy } from '@nestjs/microservices';
import { ORDER_EVENTS_TYPE } from '../event.types';

@Injectable()
export class OrderService {
  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly orderRepository: OrderRepository,
    @InjectConnection() private readonly connection: Connection,
    @Inject(ORDER_EVENTS_TYPE.ORDER_CREATED)
    private readonly eventClient: ClientProxy,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const record = await this.recordRepository.findOneWithSession(
        { _id: dto.recordId },
        session,
      );

      if (!record) {
        throw new NotFoundException('Record not found');
      }

      if (record.qty < dto.qty) {
        throw new BadRequestException('Insufficient stock');
      }

      // Deduct stock
      record.qty -= dto.qty;
      record.lastModified = new Date();
      await record.save({ session });

      // Create order
      const order = await this.orderRepository.saveWithSession(
        {
          recordId: record._id,
          qty: dto.qty,
          status: OrderStatus.PENDING,
          created: new Date(),
        },
        session,
      );

      await session.commitTransaction();

      // emit event could be read via any other service... for demo
      // will add notification service to  read the orders created
      // events can also be seen emitted via the rmq adm dashboard ('http://localhost:15672')
      this.eventClient.emit('order.created', {
        orderId: order._id,
        recordId: order.recordId,
        quantity: order.qty,
        createdAt: order.created,
      });

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
