import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { Order } from '../schemas/order.schema';
import { Record } from '../schemas/record.schema';
import { OrderService } from '../services/order.service';
import { RecordService } from '../services/record.service';
import { OrderController } from './order.controller';

describe('OrderController', () => {
  let orderController: OrderController;
  let recordService: RecordService;
  let orderService: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
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
        {
          provide: OrderService,
          useValue: {
            createOrder: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    orderController = module.get<OrderController>(OrderController);
    recordService = module.get<RecordService>(RecordService);
    orderService = module.get<OrderService>(OrderService);
  });

  describe('create', () => {
    it('should return not found error if order record doesnt exist', async () => {
      const createOrderRequestDTO: CreateOrderRequestDTO = {
        recordId: 'nonexistent-record-id',
        quantity: 1,
      };

      jest.spyOn(recordService, 'findById').mockResolvedValueOnce(undefined);
      jest.spyOn(orderService, 'createOrder');

      try {
        await orderController.create(createOrderRequestDTO);
        expect(1).toBe(2); // should not be reached
      } catch (error) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('Record not found');
      }

      expect(recordService.findById).toHaveBeenCalledWith(
        createOrderRequestDTO.recordId,
      );
      expect(orderService.createOrder).not.toHaveBeenCalled();
    });

    it('should create an order if the record exists', async () => {
      const createOrderRequestDTO: CreateOrderRequestDTO = {
        recordId: 'some-record-id',
        quantity: 1,
      };

      const testRecord: Record = {
        _id: createOrderRequestDTO.recordId,
        artist: 'Test Artist',
        album: 'Test Record',
        price: 10,
        qty: 5,
        mbid: undefined,
        trackList: [],
      } as Record;

      jest.spyOn(recordService, 'findById').mockResolvedValueOnce(testRecord);
      jest.spyOn(orderService, 'createOrder').mockResolvedValueOnce({
        _id: 'order1',
        recordId: createOrderRequestDTO.recordId,
        quantity: createOrderRequestDTO.quantity,
      } as Order);

      const result = await orderController.create(createOrderRequestDTO);

      expect(result).toEqual({
        _id: 'order1',
        recordId: createOrderRequestDTO.recordId,
        quantity: createOrderRequestDTO.quantity,
      });
      expect(recordService.findById).toHaveBeenCalledWith(
        createOrderRequestDTO.recordId,
      );
      expect(recordService.createRecord).not.toHaveBeenCalledWith({
        quantity: createOrderRequestDTO.quantity,
        recordId: createOrderRequestDTO.recordId,
      });
    });
  });
});
