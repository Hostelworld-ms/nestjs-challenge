import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from '../src/api/schemas/record.schema';

describe('RecordController (e2e)', () => {
  let app: INestApplication;
  let recordId: string | undefined;
  let recordModel: Model<Record>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    recordModel = app.get<Model<Record>>(getModelToken('Record'));
    await app.init();
  });

  // Test to create a record
  it('should create a new record', async () => {
    const album = `Abbey Road e2e ${randomUUID()}`;
    const createRecordDto = {
      artist: 'The Beatles',
      album,
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = response.body._id;
    expect(response.body).toHaveProperty('artist', 'The Beatles');
    expect(response.body).toHaveProperty('album', album);
  });

  it('should create a new record and fetch it with filters', async () => {
    const artist = `The Fake Band e2e ${randomUUID()}`;
    const createRecordDto = {
      artist,
      album: 'Fake Album',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = createResponse.body._id;

    const response = await request(app.getHttpServer())
      .get(`/records?artist=${encodeURIComponent(artist)}`)
      .expect(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]).toHaveProperty('artist', artist);
  });
  afterEach(async () => {
    if (recordId && recordModel) {
      await recordModel.findByIdAndDelete(recordId);
    }
    recordId = undefined;
    if (app) {
      await app.close();
    }
  });
});
