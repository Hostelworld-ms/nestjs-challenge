import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config';
import { RecordModule } from './record/record.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    MongooseModule.forRoot(AppConfig.mongoUrl),
    RecordModule,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
