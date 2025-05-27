import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { RecordService } from './services/record.service';
import { RecordSchema } from './schemas/record.schema';
import { MusicBrainService } from './services/musicBrain.service';
import { RecordRepository } from './record.repository';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ttl: 3600,
    }),
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
  ],
  controllers: [RecordController],
  providers: [RecordService, MusicBrainService, RecordRepository],
})
export class RecordModule {}
