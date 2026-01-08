import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { AppModule } from '../src/app.module';
import { RecordFormat, RecordCategory } from '../src/api/schemas/record.enum';

describe('RecordController (e2e) - UPDATE MBID refetch tracklist', () => {
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

  it('should refetch and update tracklist when mbid changes', async () => {
    const mbid1 = '11111111-1111-1111-1111-111111111111';
    const mbid2 = '22222222-2222-2222-2222-222222222222';

    const xml1 = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <release>
    <mediumList>
      <medium>
        <trackList>
          <track><recording><title>Track A1</title></recording></track>
          <track><recording><title>Track A2</title></recording></track>
        </trackList>
      </medium>
    </mediumList>
  </release>
</metadata>`;

    const xml2 = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <release>
    <mediumList>
      <medium>
        <trackList>
          <track><recording><title>Track B1</title></recording></track>
          <track><recording><title>Track B2</title></recording></track>
          <track><recording><title>Track B3</title></recording></track>
        </trackList>
      </medium>
    </mediumList>
  </release>
</metadata>`;

    // Create: mbid1 => tracklist A
    nock('https://musicbrainz.org')
      .get(`/ws/2/release/${mbid1}`)
      .query({ inc: 'recordings', fmt: 'xml' })
      .reply(200, xml1, { 'Content-Type': 'application/xml' });

    const createRes = await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'Refetch Band',
        album: 'Refetch Album',
        price: 10,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: mbid1,
      })
      .expect(201);

    recordId = createRes.body._id;
    expect(createRes.body.tracklist).toEqual(['Track A1', 'Track A2']);

    // Update: change to mbid2 => tracklist B
    nock('https://musicbrainz.org')
      .get(`/ws/2/release/${mbid2}`)
      .query({ inc: 'recordings', fmt: 'xml' })
      .reply(200, xml2, { 'Content-Type': 'application/xml' });

    const updateRes = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send({ mbid: mbid2 })
      .expect(200);

    expect(updateRes.body).toHaveProperty('mbid', mbid2);
    expect(updateRes.body.tracklist).toEqual([
      'Track B1',
      'Track B2',
      'Track B3',
    ]);
  });
  it('should NOT refetch tracklist when mbid stays the same', async () => {
    const mbid = '33333333-3333-3333-3333-333333333333';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <release>
    <mediumList>
      <medium>
        <trackList>
          <track><recording><title>Same 1</title></recording></track>
        </trackList>
      </medium>
    </mediumList>
  </release>
</metadata>`;

    // Create (one call)
    const scope = nock('https://musicbrainz.org')
      .get(`/ws/2/release/${mbid}`)
      .query({ inc: 'recordings', fmt: 'xml' })
      .reply(200, xml, { 'Content-Type': 'application/xml' });

    const createRes = await request(app.getHttpServer())
      .post('/records')
      .send({
        artist: 'No Refetch',
        album: 'Same MBID',
        price: 10,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid,
      })
      .expect(201);

    recordId = createRes.body._id;
    expect(createRes.body.tracklist).toEqual(['Same 1']);

    // Update with SAME mbid should not call MusicBrainz again
    const updateRes = await request(app.getHttpServer())
      .put(`/records/${recordId}`)
      .send({ mbid })
      .expect(200);

    expect(updateRes.body.tracklist).toEqual(['Same 1']);

    // If a second HTTP call happened, this would fail
    expect(scope.isDone()).toBe(true);
  });
});
