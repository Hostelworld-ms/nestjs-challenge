import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controllers/order.controller';
import { OrderSchema } from './schemas/order.schema';
import { RecordSchema } from './schemas/record.schema';
import { OrderService } from './services/order.service';
import { RecordService } from './services/record.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
  ],
  controllers: [OrderController],
  providers: [OrderService, RecordService],
})
export class OrderModule {}
