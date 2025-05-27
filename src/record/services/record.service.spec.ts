/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { RecordService } from './record.service';
import { RecordRepository } from '../record.repository';
import { MusicBrainService } from './musicBrain.service';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { Record } from '../schemas/record.schema';
import { RecordCategory, RecordFormat } from '../types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('RecordService', () => {
  let service: RecordService;
  let recordRepository: RecordRepository;
  let musicBrain: MusicBrainService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
  };

  const mockMusicBrainService = {
    fetch: jest.fn(),
    getTrackList: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordService,
        { provide: RecordRepository, useValue: mockRepository },
        { provide: MusicBrainService, useValue: mockMusicBrainService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<RecordService>(RecordService);
    recordRepository = module.get<RecordRepository>(RecordRepository);
    musicBrain = module.get<MusicBrainService>(MusicBrainService);

    process.env.MUSIC_BRAIN_BASEURL = 'https://musicbrainz.org/ws/2/release/';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return records based on artist query', async () => {
      const expectedRecords = [{ artist: 'Test' }] as Record[];
      mockRepository.find.mockResolvedValue(expectedRecords);

      const result = await service.findAll({ artist: 'Test' });

      expect(result).toEqual(expectedRecords);
      expect(mockRepository.find).toHaveBeenCalledWith(
        { artist: { $regex: 'Test', $options: 'i' } },
        0,
        10,
      );
    });

    it('should support search with "q" param', async () => {
      const expectedRecords = [{ album: 'Chill' }];
      mockRepository.find.mockResolvedValue(expectedRecords);

      const result = await service.findAll({ q: 'chill' });

      expect(mockRepository.find).toHaveBeenCalledWith(
        {
          $or: [
            { artist: { $regex: 'chill', $options: 'i' } },
            { album: { $regex: 'chill', $options: 'i' } },
            { category: { $regex: 'chill', $options: 'i' } },
            { format: { $regex: 'chill', $options: 'i' } },
          ],
        },
        0,
        10,
      );
      expect(result).toEqual(expectedRecords);
    });

    it('should apply all filters and pagination', async () => {
      const expectedRecords = [{ artist: 'Test', album: 'Album A' }];
      mockRepository.find.mockResolvedValue(expectedRecords);

      const result = await service.findAll({
        artist: 'Test',
        album: 'Album A',
        format: 'Vinyl',
        category: 'Rock',
        page: 2,
        limit: 5,
      });

      expect(result).toEqual(expectedRecords);
      expect(mockRepository.find).toHaveBeenCalledWith(
        {
          artist: { $regex: 'Test', $options: 'i' },
          album: { $regex: 'Album A', $options: 'i' },
          format: 'Vinyl',
          category: 'Rock',
        },
        5,
        5,
      );
    });

    it('should use default pagination if not provided', async () => {
      const expectedRecords = [{ artist: 'No Pagination' }];
      mockRepository.find.mockResolvedValue(expectedRecords);

      const result = await service.findAll({ category: 'Jazz' });

      expect(mockRepository.find).toHaveBeenCalledWith(
        { category: 'Jazz' },
        0,
        10,
      );
      expect(result).toEqual(expectedRecords);
    });
  });

  describe('findByIdAndUpdate', () => {
    const id = 'abc123';
    const updateDto: UpdateRecordRequestDTO = {
      price: 20,
      mbid: 'mbid-001',
    };

    it('should fetch data and update with new tracklist if mbid changed', async () => {
      const oldRecord = { _id: id, mbid: 'old-mbid' } as unknown as Record;
      const releaseData = { recordings: [] };
      const trackList = ['Track 1', 'Track 2'];

      mockRepository.findOne.mockResolvedValue(oldRecord);
      mockMusicBrainService.fetch.mockResolvedValue(releaseData);
      mockMusicBrainService.getTrackList.mockReturnValue(trackList);
      mockRepository.findOneAndUpdate.mockResolvedValue({
        ...oldRecord,
        ...updateDto,
        trackList,
      });

      const result = await service.findByIdAndUpdate(id, updateDto);

      expect(mockMusicBrainService.fetch).toHaveBeenCalled();
      expect(mockRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: id },
        { $set: { ...updateDto, trackList } },
      );
      expect(result.trackList).toEqual(trackList);
    });

    it('should not refetch if mbid did not change', async () => {
      const sameRecord = { _id: id, mbid: 'mbid-001' } as unknown as Record;

      mockRepository.findOne.mockResolvedValue(sameRecord);
      mockRepository.findOneAndUpdate.mockResolvedValue({
        ...sameRecord,
        price: 20,
      });

      await service.findByIdAndUpdate(id, updateDto);

      expect(mockMusicBrainService.fetch).not.toHaveBeenCalled();
      expect(mockRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: id },
        { $set: updateDto },
      );
    });
  });

  describe('create', () => {
    it('should create a record with fetched tracklist', async () => {
      const dto: CreateRecordRequestDTO = {
        artist: 'Artist',
        album: 'Album',
        price: 30,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.JAZZ,
        mbid: 'mbid-123',
      };

      const releaseData = { recordings: [] };
      const trackList = ['Intro', 'Outro'];
      const expected = { ...dto, trackList, created: expect.any(Date) };

      mockMusicBrainService.fetch.mockResolvedValue(releaseData);
      mockMusicBrainService.getTrackList.mockReturnValue(trackList);
      mockRepository.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(mockMusicBrainService.fetch).toHaveBeenCalledWith(
        expect.stringContaining(dto.mbid),
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...dto,
          trackList,
        }),
      );
      expect(result.trackList).toEqual(trackList);
    });
  });
});
