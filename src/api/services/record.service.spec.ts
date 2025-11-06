import { CacheUtils } from '../cache/cache.utils';
import { Record } from '../schemas/record.schema';
import { PaginationUtils } from '../utils/pagination.utils';
import { RecordService } from './record.service';

describe('RecordService', () => {
  let service: RecordService;
  let mockModel: any;
  let mockRedis: any;

  const sampleRecord = {
    _id: '507f1f77bcf86cd799439011',
    artist: 'Artist',
    album: 'Album',
    category: 'Rock',
    format: 'VINYL',
    price: 10,
    qty: 1,
  };

  beforeEach(() => {
    mockModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };

    service = new RecordService(mockModel as any, mockRedis as any);
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findAll', () => {
    it('findAll should query model with decoded cursor and filters', async () => {
      jest
        .spyOn(PaginationUtils, 'decodeCursor')
        .mockReturnValue({ last: undefined, limit: 5 });

      const docs = [sampleRecord];
      const limitMock = jest.fn().mockResolvedValue(docs);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      mockModel.find.mockReturnValue({ sort: sortMock });

      const result = await service.findAll({
        q: 'Art',
        artist: undefined,
        album: undefined,
        format: undefined,
        category: undefined,
        cursor: 'some-cursor',
      });

      expect(mockModel.find).toHaveBeenCalled();
      expect(sortMock).toHaveBeenCalledWith({ _id: 1 });
      expect(limitMock).toHaveBeenCalledWith(5);
      expect(result).toEqual(docs);
    });
  });

  describe('findAllCached', () => {
    it('returns cached value when present', async () => {
      const params = {
        q: 'x',
        artist: undefined,
        album: undefined,
        format: undefined,
        category: undefined,
        cursor: '',
      };
      jest.spyOn(CacheUtils, 'buildCacheKey').mockReturnValueOnce('cached-key');
      mockRedis.get.mockResolvedValue(JSON.stringify([sampleRecord]));

      const res = await service.findAllCached(params as any);

      expect(mockRedis.get).toHaveBeenCalledWith('cached-key');
      expect(res).toEqual([sampleRecord]);

      expect(mockModel.find).not.toHaveBeenCalled();
    });

    it('queries DB and sets cache when miss', async () => {
      const params = {
        q: undefined,
        artist: undefined,
        album: undefined,
        format: undefined,
        category: undefined,
        cursor: '',
      };
      jest
        .spyOn(CacheUtils, 'buildCacheKey')
        .mockReturnValueOnce('cache-key-2');
      mockRedis.get.mockResolvedValue(null);

      jest
        .spyOn(service, 'findAll')
        .mockResolvedValueOnce([sampleRecord as Record]);

      const res = await service.findAllCached(params as any);

      expect(mockRedis.get).toHaveBeenCalledWith('cache-key-2');
      expect(service.findAll).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'cache-key-2',
        JSON.stringify([sampleRecord as Record]),
        'EX',
        CacheUtils.getCacheTTLSeconds(),
      );
      expect(res).toEqual([sampleRecord as Record]);
    });
  });
});
