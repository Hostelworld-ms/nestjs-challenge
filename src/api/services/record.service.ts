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
  private readonly musicBrainzFetchTimeoutMs = 10_000;
  /** MusicBrainz asks for ~1 req/s per IP; pad slightly to stay under the limit. */
  private readonly musicBrainzRequestIntervalMs = 1_100;
  private readonly musicBrainzXmlCacheTtlMs = 86_400_000;
  private lastMusicBrainzRequestAt = 0;
  private musicBrainzRequestChain: Promise<unknown> = Promise.resolve();
  private readonly musicBrainzXmlCache = new Map<
    string,
    { xml: string; expiresAt: number }
  >();

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
      query.artist = this.toPrefixInsensitiveRegex(filters.artist);
    }

    if (filters.album) {
      query.album = this.toPrefixInsensitiveRegex(filters.album);
    }

    if (filters.q) {
      const search = this.toPrefixInsensitiveRegex(filters.q);
      query.$or = [{ artist: search }, { album: search }, { category: search }];
    }

    return query;
  }

  /** Prefix-anchored, case-insensitive match so MongoDB can bound index scans. */
  private toPrefixInsensitiveRegex(value: string): RegExp {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}`, 'i');
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

  private getCachedMusicBrainzXml(mbid: string): string | undefined {
    const entry = this.musicBrainzXmlCache.get(mbid);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.musicBrainzXmlCache.delete(mbid);
      return undefined;
    }
    return entry.xml;
  }

  private setCachedMusicBrainzXml(mbid: string, xml: string): void {
    this.musicBrainzXmlCache.set(mbid, {
      xml,
      expiresAt: Date.now() + this.musicBrainzXmlCacheTtlMs,
    });
  }

  /**
   * Serialize outbound MusicBrainz calls (rate limit) while letting cache hits bypass the queue.
   */
  private runThrottledMusicBrainzRequest<T>(fn: () => Promise<T>): Promise<T> {
    const job = this.musicBrainzRequestChain.then(async () => {
      const now = Date.now();
      const wait = Math.max(
        0,
        this.musicBrainzRequestIntervalMs -
          (now - this.lastMusicBrainzRequestAt),
      );
      if (wait > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, wait));
      }
      this.lastMusicBrainzRequestAt = Date.now();
      return fn();
    });
    this.musicBrainzRequestChain = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  }

  private async fetchReleaseFromMusicBrainz(mbid: string): Promise<string> {
    const cached = this.getCachedMusicBrainzXml(mbid);
    if (cached !== undefined) {
      return cached;
    }

    return this.runThrottledMusicBrainzRequest(async () => {
      const url = `https://musicbrainz.org/ws/2/release/${encodeURIComponent(mbid)}?inc=recordings&fmt=xml`;
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.musicBrainzFetchTimeoutMs,
      );
      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/xml',
            'User-Agent':
              'nestjs-record-store-challenge/1.0 (contact: challenge@local)',
          },
        });
      } catch {
        throw new BadRequestException('MusicBrainz unavailable');
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 404) {
        throw new BadRequestException('Invalid release MBID');
      }

      if (!response.ok) {
        throw new BadRequestException('MusicBrainz unavailable');
      }

      const xml = await response.text();
      this.setCachedMusicBrainzXml(mbid, xml);
      return xml;
    });
  }

  private extractTracklist(xml: string): string[] {
    const trackListBlocks =
      xml.match(/<track-list\b[\s\S]*?<\/track-list>/gi) ?? [];

    const trackBlockRegex = /<track\b[\s\S]*?<\/track>/gi;
    const titleRegex = /<title>([\s\S]*?)<\/title>/i;
    const tracks: string[] = [];

    for (const block of trackListBlocks) {
      for (const trackBlock of block.match(trackBlockRegex) ?? []) {
        const titleMatch = trackBlock.match(titleRegex);
        if (titleMatch?.[1]) {
          const title = this.decodeXmlEntities(titleMatch[1].trim());
          if (title) {
            tracks.push(title);
          }
        }
      }
    }

    return tracks;
  }

  /** Single-pass decode of the five predefined XML entities (avoids cascaded &amp;… bugs). */
  private decodeXmlEntities(value: string): string {
    const map: { [key: string]: string } = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
    };
    return value.replace(
      /&(amp|lt|gt|quot|apos);/g,
      (full, entity: string) => map[entity] ?? full,
    );
  }
}
