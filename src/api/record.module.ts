import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './controllers/order.controller';
import { RecordController } from './controllers/record.controller';
import { OrderSchema } from './schemas/order.schema';
import { RecordService } from './services/record.service';
import { OrderService } from './services/order.service';
import { RecordSchema } from './schemas/record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Record', schema: RecordSchema },
      { name: 'Order', schema: OrderSchema },
    ]),
  ],
  controllers: [RecordController, OrderController],
  providers: [RecordService, OrderService],
})
export class RecordModule {}
