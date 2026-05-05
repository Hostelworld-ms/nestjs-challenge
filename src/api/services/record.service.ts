import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import {
  FindRecordsQueryDTO,
  PaginatedRecords,
} from '../dtos/find-records.query.dto';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class RecordService {
  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(dto: CreateRecordRequestDTO): Promise<Record> {
    try {
      return await this.recordModel.create({ ...dto, lastModified: new Date() });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException(
          'A record with this artist, album and format already exists.',
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateRecordRequestDTO): Promise<Record> {
    try {
      const updated = await this.recordModel.findByIdAndUpdate(
        id,
        { ...dto, lastModified: new Date() },
        { new: true, runValidators: true },
      );
      if (!updated) throw new NotFoundException(`Record ${id} not found`);
      return updated;
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException(
          'A record with this artist, album and format already exists.',
        );
      }
      throw err;
    }
  }

  async findById(id: string): Promise<Record> {
    const record = await this.recordModel.findById(id).exec();
    if (!record) throw new NotFoundException(`Record ${id} not found`);
    return record;
  }

  async find(query: FindRecordsQueryDTO): Promise<PaginatedRecords<Record>> {
    const { q, artist, album, format, category, page, limit } = query;

    const filter: FilterQuery<Record> = {};
    let projection: { [key: string]: unknown } | undefined;
    let sort: { [key: string]: unknown } = { _id: 1 };

    if (q) {
      filter.$text = { $search: q };
      projection = { score: { $meta: 'textScore' } };
      sort = { score: { $meta: 'textScore' } };
    }
    if (artist) filter.artist = { $regex: escapeRegex(artist), $options: 'i' };
    if (album) filter.album = { $regex: escapeRegex(album), $options: 'i' };
    if (format) filter.format = format;
    if (category) filter.category = category;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.recordModel
        .find(filter, projection)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as unknown as Promise<Record[]>,
      this.recordModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
