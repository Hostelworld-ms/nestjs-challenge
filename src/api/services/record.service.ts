import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record } from '../schemas/record.schema';

@Injectable()
export class RecordService {
  private readonly maxLimit = 100;

  constructor(
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}

  async create(request: CreateRecordRequestDTO): Promise<Record> {
    const tracklist = await this.resolveTracklist(request.mbid);
    try {
      return await this.recordModel.create({
        ...request,
        tracklist,
      });
    } catch (err) {
      this.rethrowIfDuplicateKey(err);
      throw err;
    }
  }

  async update(id: string, payload: UpdateRecordRequestDTO): Promise<Record> {
    const record = await this.recordModel.findById(id).exec();
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    const nextMbid = payload.mbid;
    const mbidChanged = nextMbid !== undefined && nextMbid !== record.mbid;
    const tracklist = mbidChanged
      ? await this.resolveTracklist(nextMbid)
      : undefined;

    Object.assign(record, payload);
    if (tracklist) {
      record.tracklist = tracklist;
    }

    try {
      return await record.save();
    } catch (err) {
      this.rethrowIfDuplicateKey(err);
      throw err;
    }
  }

  async findAll(filters: {
    q?: string;
    artist?: string;
    album?: string;
    format?: RecordFormat;
    category?: RecordCategory;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Record[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), this.maxLimit);
    const query = this.buildQuery(filters);

    const [data, total] = await Promise.all([
      this.recordModel
        .find(query)
        .sort({ artist: 1, album: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.recordModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private buildQuery(filters: {
    q?: string;
    artist?: string;
    album?: string;
    format?: RecordFormat;
    category?: RecordCategory;
  }): FilterQuery<Record> {
    const query: FilterQuery<Record> = {};

    if (filters.format) {
      query.format = filters.format;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.artist) {
      query.artist = this.toInsensitiveRegex(filters.artist);
    }

    if (filters.album) {
      query.album = this.toInsensitiveRegex(filters.album);
    }

    if (filters.q) {
      const search = this.toInsensitiveRegex(filters.q);
      query.$or = [{ artist: search }, { album: search }, { category: search }];
    }

    return query;
  }

  private toInsensitiveRegex(value: string): RegExp {
    return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  private rethrowIfDuplicateKey(err: unknown): void {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      throw new ConflictException(
        'A record with this artist, album, and format already exists',
      );
    }
  }

  private async resolveTracklist(mbid?: string): Promise<string[]> {
    if (!mbid) {
      return [];
    }

    const xml = await this.fetchReleaseFromMusicBrainz(mbid);
    return this.extractTracklist(xml);
  }

  private async fetchReleaseFromMusicBrainz(mbid: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(
        `https://musicbrainz.org/ws/2/release/${encodeURIComponent(mbid)}?inc=recordings&fmt=xml`,
        {
          headers: {
            Accept: 'application/xml',
            'User-Agent':
              'nestjs-record-store-challenge/1.0 (contact: challenge@local)',
          },
        },
      );
    } catch {
      throw new BadRequestException('MusicBrainz unavailable');
    }

    if (response.status === 404) {
      throw new BadRequestException('Invalid release MBID');
    }

    if (!response.ok) {
      throw new BadRequestException('MusicBrainz unavailable');
    }

    return response.text();
  }

  private extractTracklist(xml: string): string[] {
    const trackListMatch = xml.match(/<track-list[\s\S]*?<\/track-list>/i);
    if (!trackListMatch) {
      return [];
    }

    const trackBlockRegex = /<track\b[\s\S]*?<\/track>/gi;
    const titleRegex = /<title>([\s\S]*?)<\/title>/i;
    const tracks: string[] = [];

    for (const trackBlock of trackListMatch[0].match(trackBlockRegex) ?? []) {
      const titleMatch = trackBlock.match(titleRegex);
      if (titleMatch?.[1]) {
        const title = this.decodeXmlEntities(titleMatch[1].trim());
        if (title) {
          tracks.push(title);
        }
      }
    }

    return tracks;
  }

  private decodeXmlEntities(value: string): string {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }
}
