import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let recordId: string;
  let recordModel: any;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    recordModel = app.get('RecordModel');
    await app.init();
  });

  afterAll(async () => {
    if (recordId) {
      await recordModel.findByIdAndDelete(recordId);
    }
    if (app) await app.close();
  });

  it('should create an order and decrement stock atomically', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'Test Band',
        album: 'Test Album',
        price: 10,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      })
      .expect(201);

    recordId = createRes.body._id;

    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .send({
        recordId,
        quantity: 3,
      })
      .expect(201);

    expect(orderRes.body).toHaveProperty('remainingStock', 2);

    await request(app.getHttpServer())
      .post('/orders')
      .send({
        recordId,
        quantity: 5,
      })
      .expect(409);
  });
});
