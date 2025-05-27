import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Record } from '../schemas/record.schema';
import { FilterQuery } from 'mongoose';
import { RecordRepository } from '../record.repository';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { MusicBrainService } from './musicBrain.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MusicBrainRecordResponse } from '../types';

const musicBrainBaseUrl = process.env.MUSIC_BRAIN_BASEURL;

export type RecordFilterOptions = {
  limit?: number;
  page?: number;
} & FilterQuery<Record>;

@Injectable()
export class RecordService {
  constructor(
    private readonly recordRepository: RecordRepository,
    private readonly musicBrain: MusicBrainService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  findAll(filterOptions: RecordFilterOptions) {
    const {
      album,
      q,
      format,
      category,
      artist,
      page = 1,
      limit = 10,
    } = filterOptions;

    const query: FilterQuery<Record> = {};

    if (q) {
      query.$or = [
        { artist: { $regex: q, $options: 'i' } },
        { album: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { format: { $regex: q, $options: 'i' } },
      ];
    }

    if (artist) {
      query.artist = { $regex: artist, $options: 'i' };
    }

    if (album) {
      query.album = { $regex: album, $options: 'i' };
    }

    if (format) {
      query.format = format;
    }

    if (category) {
      query.category = category;
    }
    const skip = (page - 1) * limit;
    try {
      return this.recordRepository.find(query, skip, limit);
    } catch (error) {
      throw new NotFoundException(error?.message);
    }
  }

  async findByIdAndUpdate(id: string, updateRecordDto: UpdateRecordRequestDTO) {
    const record = await this.recordRepository.findOne({ _id: id });
    if (!record?._id) {
      throw new NotFoundException(`can not update this record with id: ${id}`);
    }
    try {
      if (updateRecordDto.mbid && record.mbid !== updateRecordDto.mbid) {
        const cacheKey = `mbid:${updateRecordDto.mbid}`;
        let releaseRecords = (await this.cacheManager.get(
          cacheKey,
        )) as MusicBrainRecordResponse;

        if (!releaseRecords) {
          const url = `${musicBrainBaseUrl}${updateRecordDto.mbid}?inc=recordings`;
          releaseRecords = await this.musicBrain.fetch(url);
          await this.cacheManager.set(cacheKey, releaseRecords, 300);
        }

        const trackList = this.musicBrain.getTrackList(releaseRecords);

        return this.recordRepository.findOneAndUpdate(
          { _id: id },
          { $set: { ...updateRecordDto, trackList } },
        );
      }

      return this.recordRepository.findOneAndUpdate(
        { _id: id },
        { $set: updateRecordDto },
      );
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }
  async create(request: CreateRecordRequestDTO) {
    try {
      if (request.mbid) {
        const cacheKey = `mbid:${request.mbid}`;
        let releaseRecords = (await this.cacheManager.get(
          cacheKey,
        )) as MusicBrainRecordResponse;

        if (!releaseRecords) {
          const url = `${musicBrainBaseUrl}${request.mbid}?inc=recordings`;
          releaseRecords = await this.musicBrain.fetch(url);
          await this.cacheManager.set(cacheKey, releaseRecords, 300);
        }

        const trackList = this.musicBrain.getTrackList(releaseRecords);

        return this.recordRepository.create({
          ...request,
          created: new Date(),
          trackList,
        });
      }
      return this.recordRepository.create({
        ...request,
        created: new Date(),
      });
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }
}
