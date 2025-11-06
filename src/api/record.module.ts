import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from './cache/redis.module';
import { RecordController } from './controllers/record.controller';
import { RecordSchema } from './schemas/record.schema';
import { MusicBrainzService } from './services/music-brainz.service';
import { RecordService } from './services/record.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
    RedisModule,
  ],
  controllers: [RecordController],
  providers: [RecordService, MusicBrainzService],
})
export class RecordModule {}
