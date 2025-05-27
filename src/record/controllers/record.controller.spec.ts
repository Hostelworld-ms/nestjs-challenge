import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { RecordService } from '../services/record.service';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { Record } from '../schemas/record.schema';
import { RecordCategory, RecordFormat } from '../types';

describe('RecordController', () => {
  let controller: RecordController;
  let service: RecordService;

  const mockRecordService = {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [{ provide: RecordService, useValue: mockRecordService }],
    }).compile();

    controller = module.get<RecordController>(RecordController);
    service = module.get<RecordService>(RecordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const dto: CreateRecordRequestDTO = {
        artist: 'Amazing test Artist',
        album: 'The Greatest Hits',
        price: 29.99,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };

      const createdRecord = { _id: '1', ...dto } as unknown as Record;
      mockRecordService.create.mockResolvedValue(createdRecord);

      const result = await controller.create(dto);
      expect(result).toEqual(createdRecord);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update an existing record', async () => {
      const id = 'abc123';
      const dto: UpdateRecordRequestDTO = { price: 34.99 };
      const updatedRecord = {
        _id: id,
        artist: 'John Doe',
        album: 'The Greatest Hits',
        price: 34.99,
        qty: 10,
        format: 'Vinyl',
        category: 'Rock',
      } as unknown as Record;

      mockRecordService.findByIdAndUpdate.mockResolvedValue(updatedRecord);

      const result = await controller.update(id, dto);
      expect(result).toEqual(updatedRecord);
      expect(service.findByIdAndUpdate).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of records with optional filters', async () => {
      const filters = { artist: 'Amazing test Artist' };
      const recordList = [
        {
          _id: '1',
          artist: 'Amazing test Artist',
          album: 'First Album',
          price: 19.99,
          qty: 5,
          format: 'CD',
          category: 'Pop',
        },
      ] as unknown as Record[];

      mockRecordService.findAll.mockResolvedValue(recordList);

      const result = await controller.findAll(filters);
      expect(result).toEqual(recordList);
      expect(service.findAll).toHaveBeenCalledWith(filters);
    });
  });
});
