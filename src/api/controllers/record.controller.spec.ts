import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { RecordService } from '../services/record.service';

describe('RecordController', () => {
  let recordController: RecordController;
  let recordService: RecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: RecordService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    recordController = module.get<RecordController>(RecordController);
    recordService = module.get<RecordService>(RecordService);
  });

  it('should create a new record', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    const savedRecord = {
      _id: '1',
      album: 'Test Record',
      price: 100,
      qty: 10,
    };

    jest.spyOn(recordService, 'create').mockResolvedValue(savedRecord as any);

    const result = await recordController.create(createRecordDto);
    expect(result).toEqual(savedRecord);
    expect(recordService.create).toHaveBeenCalledWith(createRecordDto);
  });

  it('should return paginated records', async () => {
    const records = {
      data: [
        { _id: '1', name: 'Record 1', price: 100, qty: 10 },
        { _id: '2', name: 'Record 2', price: 200, qty: 20 },
      ],
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    };

    jest.spyOn(recordService, 'findAll').mockResolvedValue(records as any);

    const result = await recordController.findAll();
    expect(result).toEqual(records);
    expect(recordService.findAll).toHaveBeenCalledWith({
      q: undefined,
      artist: undefined,
      album: undefined,
      format: undefined,
      category: undefined,
      page: undefined,
      limit: undefined,
    });
  });
});
