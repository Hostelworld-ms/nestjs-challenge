import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import Redis from 'ioredis';
import { Model } from 'mongoose';
import { CacheUtils } from '../cache/cache.utils';
import { REDIS_CLIENT } from '../cache/redis.module';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record } from '../schemas/record.schema';
import { PaginationUtils } from '../utils/pagination.utils';

export type FindAllRecordsParams = {
  q?: string;
  artist?: string;
  album?: string;
  format?: RecordFormat;
  category?: RecordCategory;
  cursor: string;
};

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name);

  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async findAllCached(params: FindAllRecordsParams): Promise<Record[]> {
    const cacheKey = CacheUtils.buildCacheKey(params);
    let cached: string | null;
    try {
      cached = await this.redisClient.get(cacheKey);
    } catch (err) {
      this.logger.warn('Redis GET failed (cache read failed)', err);
    }
    if (cached) {
      return JSON.parse(cached);
    } else {
      const response = await this.findAll(params);
      try {
        await this.redisClient.set(
          cacheKey,
          JSON.stringify(response),
          'EX',
          CacheUtils.getCacheTTLSeconds(),
        );
      } catch (err) {
        this.logger.warn('Redis SET failed (cache write failed)', err);
      }
      return response;
    }
  }

  async findAll(params: FindAllRecordsParams): Promise<Record[]> {
    const decodedCursor = PaginationUtils.decodeCursor(params.cursor);
    this.logger.log(`Decoded cursor: ${JSON.stringify(decodedCursor)}`);

    let findQuery = {};

    if (decodedCursor.last) {
      findQuery['_id'] = { $gt: decodedCursor.last };
    }

    if (params.q) {
      const searchTerm = params.q;
      findQuery['$or'] = [
        { artist: { $regex: searchTerm, $options: 'i' } },
        { album: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (params.artist) {
      findQuery['artist'] = params.artist;
    }

    if (params.album) {
      findQuery['album'] = params.album;
    }

    if (params.format) {
      findQuery['format'] = params.format;
    }

    if (params.category) {
      findQuery['category'] = params.category;
    }

    return this.recordModel
      .find(findQuery)
      .sort({
        _id: 1,
      })
      .limit(decodedCursor.limit);
  }

  async findById(id: string): Promise<Record | null> {
    return this.recordModel.findById(id);
  }

  async findOne(filters: Partial<Record>): Promise<Record | null> {
    return this.recordModel.findOne(filters as any);
  }

  async createRecord(recordData: Partial<Record>): Promise<Record> {
    return this.recordModel.create(recordData);
  }
}
