import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { OrderController } from './controllers/order.controller';
import { RecordService } from './services/record.service';
import { MusicBrainzService } from './services/musicbrainz.service';
import { RecordSchema } from './schemas/record.schema';
import { OrderSchema } from './schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Record', schema: RecordSchema },
      { name: 'Order', schema: OrderSchema },
    ]),
  ],
  controllers: [RecordController, OrderController],
  providers: [RecordService, MusicBrainzService],
})
export class RecordModule {}
