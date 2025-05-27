/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './types/order.types';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  const mockOrder = {
    _id: 'order123',
    recordId: 'rec123',
    qty: 2,
    status: OrderStatus.PENDING,
    created: new Date(),
  };

  const mockOrderService = {
    createOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call orderService.createOrder and return the result', async () => {
    const dto: CreateOrderDto = {
      recordId: 'rec123',
      qty: 2,
    };

    (mockOrderService.createOrder as jest.Mock).mockResolvedValue(mockOrder);

    const result = await controller.create(dto);

    expect(mockOrderService.createOrder).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockOrder);
  });
});
