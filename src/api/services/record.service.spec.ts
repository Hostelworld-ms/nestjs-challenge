import { BadRequestException, ConflictException } from '@nestjs/common';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordService } from './record.service';

const minimalCreatePayload = {
  artist: 'Test Artist',
  album: 'Test Album',
  price: 10,
  qty: 1,
  format: RecordFormat.VINYL,
  category: RecordCategory.ROCK,
};

describe('RecordService - MusicBrainz error handling', () => {
  let service: RecordService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new RecordService({} as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns Invalid release MBID for MusicBrainz 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: jest.fn(),
    } as unknown as Response);

    await expect(
      (service as any).fetchReleaseFromMusicBrainz('invalid-release-id'),
    ).rejects.toThrow(new BadRequestException('Invalid release MBID'));
  });

  it('returns MusicBrainz unavailable when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    await expect(
      (service as any).fetchReleaseFromMusicBrainz('any-id'),
    ).rejects.toThrow(new BadRequestException('MusicBrainz unavailable'));
  });

  it('returns MusicBrainz unavailable for non-404 non-ok responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: jest.fn(),
    } as unknown as Response);

    await expect(
      (service as any).fetchReleaseFromMusicBrainz('any-id'),
    ).rejects.toThrow(new BadRequestException('MusicBrainz unavailable'));
  });
});

describe('RecordService - duplicate key handling', () => {
  it('maps Mongo duplicate key on create to ConflictException', async () => {
    const mockModel = {
      create: jest.fn().mockRejectedValue({ code: 11000 }),
    };
    const service = new RecordService(mockModel as any);

    await expect(service.create(minimalCreatePayload)).rejects.toThrow(
      new ConflictException(
        'A record with this artist, album, and format already exists',
      ),
    );
  });

  it('maps Mongo duplicate key on save to ConflictException', async () => {
    const recordDoc = {
      mbid: undefined,
      save: jest.fn().mockRejectedValue({ code: 11000 }),
    };
    const mockModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(recordDoc),
      }),
    };
    const service = new RecordService(mockModel as any);

    await expect(
      service.update('507f1f77bcf86cd799439011', { price: 99 }),
    ).rejects.toThrow(
      new ConflictException(
        'A record with this artist, album, and format already exists',
      ),
    );
  });
});
