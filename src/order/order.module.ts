// order.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Record, RecordSchema } from '../record/schemas/record.schema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { RecordRepository } from 'src/record/record.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ORDER_EVENTS_TYPE } from '../event.types';

const RMQ_URI = process.env.RMQ_URI;

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Record.name, schema: RecordSchema },
    ]),
    ClientsModule.register([
      {
        name: ORDER_EVENTS_TYPE.ORDER_CREATED,
        transport: Transport.RMQ,
        options: {
          urls: [RMQ_URI],
          queue: 'order_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, RecordRepository],
})
export class OrderModule {}
