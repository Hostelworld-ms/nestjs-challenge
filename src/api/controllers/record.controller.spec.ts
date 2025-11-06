import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types, UpdateWriteOpResult } from 'mongoose';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { Record } from '../schemas/record.schema';
import { MusicBrainzService } from '../services/music-brainz.service';
import { RecordService } from '../services/record.service';
import {
  DEFAULT_PAGINATION_LIMIT,
  PaginationUtils,
} from '../utils/pagination.utils';
import { RecordController } from './record.controller';

describe('RecordController', () => {
  let recordController: RecordController;
  let recordModel: Model<Record>;
  let recordService: RecordService;
  let musicBrainzService: MusicBrainzService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: getModelToken('Record'),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            updateOne: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: MusicBrainzService,
          useValue: {
            getReleaseTrackList: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: RecordService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
            findById: jest.fn().mockResolvedValue(null),
            createRecord: jest.fn().mockResolvedValue(null),
            findAll: jest.fn().mockResolvedValue([]),
            findAllCached: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    recordModel = module.get<Model<Record>>(getModelToken('Record'));
    recordController = module.get<RecordController>(RecordController);
    recordService = module.get<RecordService>(RecordService);
    musicBrainzService = module.get<MusicBrainzService>(MusicBrainzService);
  });

  describe('create', () => {
    it('should create a new record without a tracklist if mbid is not provided', async () => {
      const createRecordDto: CreateRecordRequestDTO = {
        artist: `Artist`,
        album: 'Test Record',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
        mbid: undefined,
      };

      const savedRecord = {
        _id: '1',
        name: 'Test Record',
        price: 100,
        qty: 10,
        mbid: undefined,
        tracklist: [],
      };

      jest.spyOn(recordService, 'findOne').mockResolvedValueOnce(undefined);
      jest
        .spyOn(recordService, 'createRecord')
        .mockResolvedValue(savedRecord as any);
      jest
        .spyOn(musicBrainzService, 'getReleaseTrackList')
        .mockResolvedValue([]);

      const result = await recordController.create(createRecordDto);
      expect(result).toEqual(savedRecord);
      expect(musicBrainzService.getReleaseTrackList).not.toHaveBeenCalled();
      expect(recordService.createRecord).toHaveBeenCalledWith({
        artist: 'Artist',
        album: 'Test Record',
        price: 100,
        qty: 10,
        category: RecordCategory.ALTERNATIVE,
        format: RecordFormat.VINYL,
        mbid: undefined,
        trackList: [],
      });
    });

    it('should fetch a tracklist if mbid is provided', async () => {
      const createRecordDto: CreateRecordRequestDTO = {
        artist: `Artist`,
        album: 'Test Record',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
        mbid: 'some-mbid',
      };

      const trackList = ['aaa', 'bbb'];
      const savedRecord = {
        _id: '1',
        name: 'Test Record',
        price: 100,
        qty: 10,
        mbid: undefined,
        trackList,
      };

      jest.spyOn(recordService, 'findOne').mockResolvedValueOnce(undefined);
      jest
        .spyOn(recordService, 'createRecord')
        .mockResolvedValue(savedRecord as any);
      jest
        .spyOn(musicBrainzService, 'getReleaseTrackList')
        .mockResolvedValue(trackList);

      const result = await recordController.create(createRecordDto);
      expect(musicBrainzService.getReleaseTrackList).toHaveBeenCalledWith(
        'some-mbid',
      );
      expect(result).toEqual(savedRecord);
    });

    it('should not create a new record if it exists already', async () => {
      const createRecordDto: CreateRecordRequestDTO = {
        artist: `Artist`,
        album: 'Test Record',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
        mbid: undefined,
      };

      jest.spyOn(recordService, 'findOne').mockResolvedValueOnce({} as Record);
      jest.spyOn(recordService, 'createRecord').mockResolvedValue({} as Record);

      try {
        const result = await recordController.create(createRecordDto);
        expect(1).toBe(2); // This should not be reached
      } catch (e) {
        expect(e.status).toBe(409);
        expect(e.message).toBe(
          'Record already exists with the same artist, album, and format',
        );
      }
      expect(recordService.createRecord).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('if record does not exist, throw NotFoundException', async () => {
      const nonExistentRecordId = 'non-existent-id';
      const updateRecordDto = {
        artist: 'Updated Artist',
      };

      jest.spyOn(recordService, 'findById').mockResolvedValueOnce(undefined);

      try {
        const result = await recordController.update(
          nonExistentRecordId,
          updateRecordDto,
        );
        expect(1).toBe(2); // This should not be reached
      } catch (e) {
        expect(e.status).toBe(404);
        expect(e.message).toBe('Record not found');
      }
    });

    it('if record mbid is changed, fetch new tracklist', async () => {
      const existingRecordId = '1';
      const existingRecord: Record = {
        _id: existingRecordId,
        artist: 'Test',
        album: 'Test Record',
        price: 100,
        qty: 10,
        mbid: 'old-mbid',
        save: jest.fn(),
      } as unknown as Record;

      const updateRecordDto = {
        mbid: 'new-mbid',
      };

      jest
        .spyOn(recordService, 'findById')
        .mockResolvedValueOnce(existingRecord);
      jest
        .spyOn(musicBrainzService, 'getReleaseTrackList')
        .mockResolvedValueOnce(['Track 1', 'Track 2']);

      jest.spyOn(recordModel, 'updateOne').mockResolvedValueOnce({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedCount: 0,
      } as UpdateWriteOpResult);

      const result = await recordController.update(
        existingRecordId,
        updateRecordDto,
      );
      expect(musicBrainzService.getReleaseTrackList).toHaveBeenCalledWith(
        'new-mbid',
      );
      expect(existingRecord.trackList).toEqual(['Track 1', 'Track 2']);
      expect(result).toEqual(existingRecord);
    });
  });

  describe('findAll', () => {
    it('should return an array of records with default cursor options', async () => {
      const records: Record[] = [
        {
          _id: new Types.ObjectId('656f5b4d7f1d2c6f1e8e4b1a'),
          artist: 'Chameleons',
          album: 'Script of the Bridge',
          price: 18,
          qty: 2,
          format: RecordFormat.VINYL,
          category: RecordCategory.ALTERNATIVE,
          mbid: '21c47b6a-4c66-32ea-b67d-0987ba2a0a59',
          trackList: [],
          created: new Date('2025-11-06T10:48:45.747Z'),
          lastModified: new Date('2025-11-06T10:48:45.747Z'),
        } as unknown as Record,
      ];

      jest
        .spyOn(recordService, 'findAllCached')
        .mockResolvedValueOnce(records as Record[]);

      const result = await recordController.findAll();
      expect(result.data).toEqual(records);
      expect(result.nextCursor).toBe(
        PaginationUtils.encodeCursor({
          last: records[records.length - 1]._id as string,
          limit: DEFAULT_PAGINATION_LIMIT,
        }),
      );
      expect(recordService.findAllCached).toHaveBeenCalledWith({
        cursor: 'eyJsaW1pdCI6NX0=',
        q: undefined,
        artist: undefined,
        album: undefined,
        format: undefined,
        category: undefined,
      });
    });

    it('if there are not records, it should return an empty list without nextCursor', async () => {
      jest
        .spyOn(recordService, 'findAllCached')
        .mockResolvedValueOnce([] as Record[]);

      const result = await recordController.findAll();
      expect(result.data).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });
  });
});
