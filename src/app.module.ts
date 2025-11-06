import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderModule } from './api/order.module';
import { RecordModule } from './api/record.module';
import { AppConfig } from './app.config';

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
