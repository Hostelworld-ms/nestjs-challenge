import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { getModelToken } from '@nestjs/mongoose';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { MusicBrainzService } from '../services/musicbrainz.service';

describe('RecordController', () => {
  let controller: RecordController;

  const recordModelMock = {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  };

  const musicBrainzServiceMock = {
    fetchTracklistByMbid: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        { provide: getModelToken('Record'), useValue: recordModelMock },
        { provide: MusicBrainzService, useValue: musicBrainzServiceMock },
      ],
    }).compile();

    controller = module.get<RecordController>(RecordController);
    jest.clearAllMocks();
  });

  it('should create a new record', async () => {
    const dto = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
      mbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
    };

    musicBrainzServiceMock.fetchTracklistByMbid.mockResolvedValue([
      'Track 1',
      'Track 2',
    ]);

    recordModelMock.create.mockResolvedValue({
      _id: '1',
      ...dto,
      tracklist: ['Track 1', 'Track 2'],
    });

    const result = await controller.create(dto as any);

    expect(musicBrainzServiceMock.fetchTracklistByMbid).toHaveBeenCalledTimes(
      1,
    );
    expect(musicBrainzServiceMock.fetchTracklistByMbid).toHaveBeenCalledWith(
      dto.mbid,
    );

    expect(recordModelMock.create).toHaveBeenCalledWith({
      artist: dto.artist,
      album: dto.album,
      price: dto.price,
      qty: dto.qty,
      format: dto.format,
      category: dto.category,
      mbid: dto.mbid,
      tracklist: ['Track 1', 'Track 2'],
    });

    expect(result).toHaveProperty('_id', '1');
  });

  it('should return an array of records', async () => {
    const records = [
      {
        _id: '1',
        artist: 'The Fake Band',
        album: 'Fake Album',
        price: 25,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      },
    ];

    // mock mongoose chain: find().sort().limit().exec()
    recordModelMock.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(records),
    });

    const result = await controller.findAll(
      undefined, // q
      'The Fake Band', // artist
      undefined, // album
      undefined, // format
      undefined, // category
      '20', // limit
      undefined, // after
    );

    expect(recordModelMock.find).toHaveBeenCalledTimes(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('artist', 'The Fake Band');
  });
});
