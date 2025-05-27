import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { Order } from './schemas/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class OrderRepository extends AbstractRepository<Order> {
  protected readonly logger = new Logger(OrderRepository.name);

  constructor(
    @InjectModel(Order.name)
    reservationModel: Model<Order>,
  ) {
    super(reservationModel);
  }
}
