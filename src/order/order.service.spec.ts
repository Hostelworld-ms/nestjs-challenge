import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { RecordRepository } from '../record/record.repository';
import { OrderRepository } from './order.repository';
import { ClientProxy } from '@nestjs/microservices';
import { getConnectionToken } from '@nestjs/mongoose';
import { OrderStatus } from './types/order.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ORDER_EVENTS_TYPE } from '../event.types';

describe('OrderService', () => {
  let service: OrderService;
  let mockRecordRepo: RecordRepository;
  let mockOrderRepo: OrderRepository;
  let mockClientProxy: ClientProxy;
  let mockConnection: any;
  let mockSession: any;

  const mockRecord = {
    _id: 'rec123',
    qty: 10,
    save: jest.fn(),
  };

  const mockOrder = {
    _id: 'order123',
    recordId: 'rec123',
    qty: 2,
    status: OrderStatus.PENDING,
    created: new Date(),
  };

  beforeEach(async () => {
    mockRecordRepo = {
      findOneWithSession: jest.fn(),
    } as any;

    mockOrderRepo = {
      saveWithSession: jest.fn(),
    } as any;

    mockClientProxy = {
      emit: jest.fn(),
    } as any;

    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: RecordRepository, useValue: mockRecordRepo },
        { provide: OrderRepository, useValue: mockOrderRepo },
        { provide: ORDER_EVENTS_TYPE.ORDER_CREATED, useValue: mockClientProxy },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should create an order and emit event', async () => {
    const dto = { recordId: 'rec123', qty: 2 };

    mockRecordRepo.findOneWithSession = jest
      .fn()
      .mockResolvedValue({ ...mockRecord });
    mockOrderRepo.saveWithSession = jest.fn().mockResolvedValue(mockOrder);

    const result = await service.createOrder(dto);

    expect(mockConnection.startSession).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockRecordRepo.findOneWithSession).toHaveBeenCalledWith(
      { _id: dto.recordId },
      mockSession,
    );
    expect(mockRecord.save).toHaveBeenCalledWith({ session: mockSession });
    expect(mockOrderRepo.saveWithSession).toHaveBeenCalledWith(
      expect.objectContaining({
        recordId: dto.recordId,
        qty: dto.qty,
        status: OrderStatus.PENDING,
      }),
      mockSession,
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
    expect(mockClientProxy.emit).toHaveBeenCalledWith('order.created', {
      orderId: mockOrder._id,
      recordId: mockOrder.recordId,
      quantity: mockOrder.qty,
      createdAt: mockOrder.created,
    });

    expect(result).toEqual(mockOrder);
  });

  it('should throw NotFoundException if record not found', async () => {
    mockRecordRepo.findOneWithSession = jest.fn().mockResolvedValue(null);

    await expect(
      service.createOrder({ recordId: 'missing-id', qty: 1 }),
    ).rejects.toThrow(NotFoundException);

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should throw BadRequestException if insufficient stock', async () => {
    mockRecordRepo.findOneWithSession = jest.fn().mockResolvedValue({
      ...mockRecord,
      qty: 1,
    });

    await expect(
      service.createOrder({ recordId: 'rec123', qty: 5 }),
    ).rejects.toThrow(BadRequestException);

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('should abort transaction if error occurs during order creation', async () => {
    mockRecordRepo.findOneWithSession = jest.fn().mockImplementation(() => {
      throw new Error('DB failure');
    });

    await expect(
      service.createOrder({ recordId: 'rec123', qty: 1 }),
    ).rejects.toThrow('DB failure');

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
  });
});
