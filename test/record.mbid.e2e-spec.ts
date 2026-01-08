import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';

describe('RecordController (e2e) - MBID tracklist', () => {
  let app: INestApplication;
  let recordId: string;
  let recordModel: any;

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    recordModel = app.get('RecordModel');
    await app.init();
  });

  afterEach(async () => {
    if (recordId) {
      await recordModel.findByIdAndDelete(recordId);
      recordId = undefined;
    }
    nock.cleanAll();
  });

  afterAll(async () => {
    nock.cleanAll();
    if (app) await app.close();
  });

  it('should populate tracklist when creating a record with valid mbid', async () => {
    const mbid = 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <release>
    <mediumList>
      <medium>
        <trackList>
          <track><recording><title>Come Together</title></recording></track>
          <track><recording><title>Something</title></recording></track>
        </trackList>
      </medium>
    </mediumList>
  </release>
</metadata>`;

    nock('https://musicbrainz.org')
      .get(`/ws/2/release/${mbid}`)
      .query({ inc: 'recordings', fmt: 'xml' })
      .reply(200, xml, { 'Content-Type': 'application/xml' });

    const createRecordDto = {
      artist: 'The Beatles',
      album: 'Abbey Road',
      price: 25,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid,
    };

    const res = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    recordId = res.body._id;

    expect(res.body).toHaveProperty('mbid', mbid);
    expect(res.body).toHaveProperty('tracklist');
    expect(res.body.tracklist).toEqual(['Come Together', 'Something']);
  });
});
