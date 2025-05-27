import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Record } from '../src/record/schemas/record.schema';
import { Model } from 'mongoose';
import { RecordFormat, RecordCategory } from '../src/record/types';
import { MusicBrainService } from '../src/record/services/musicBrain.service';

jest.setTimeout(15000);

describe('RecordController (e2e) with partial MusicBrainService mock', () => {
  let app: INestApplication;
  let recordModel: Model<Record>;
  const createdRecordIds: string[] = [];

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const realMusicBrainService =
        moduleFixture.get<MusicBrainService>(MusicBrainService);

      jest.spyOn(realMusicBrainService, 'fetch').mockResolvedValue({
        media: [
          {
            tracks: [
              {
                title: 'Mocked Track 1',
                position: 0,
                recording: {
                  disambiguation: 'fake',
                  'first-release-date': 'some date',
                  video: true,
                  title: 'some title',
                },
                length: 3244,
                id: 'some-id-1',
              },
              {
                title: 'Mocked Track 2',
                position: 1,
                recording: {
                  disambiguation: 'fake',
                  'first-release-date': 'some date',
                  video: true,
                  title: 'some title',
                },
                length: 3244,
                id: 'some-id-2',
              },
            ],
          },
        ],
      });

      app = moduleFixture.createNestApplication();
      await app.init();

      recordModel = app.get<Model<Record>>(getModelToken(Record.name));

      await recordModel.deleteMany({});
    } catch (err) {
      console.error('beforeAll setup failed:', err);
      throw err;
    }
  });

  afterEach(async () => {
    for (const id of createdRecordIds) {
      await recordModel.findByIdAndDelete(id);
    }
    createdRecordIds.length = 0;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    try {
      if (recordModel) await recordModel.deleteMany({});
      if (app) await app.close();
    } catch (err) {
      console.error('afterAll teardown failed:', err);
    }
  });

  it('should create a record with real getTrackList and mocked fetch', async () => {
    const uniqueId = Math.random().toString(36).substring(2, 8);

    const createRecordDto = {
      artist: `Partial Mock Band ${uniqueId}`,
      album: `Partial Mock Album ${uniqueId}`,
      price: 40,
      qty: 5,
      mbid: `mocked-partial-${uniqueId}`,
      format: RecordFormat.VINYL,
      category: RecordCategory.CLASSICAL,
    };

    const response = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    createdRecordIds.push(response.body._id);

    expect(response.body.trackList).toEqual([
      {
        disambiguation: 'fake',
        firstReleaseDate: 'some date',
        id: 'some-id-1',
        length: 3244,
        title: 'Mocked Track 1',
        titleInTheRecording: 'some title',
        video: true,
      },
      {
        disambiguation: 'fake',
        firstReleaseDate: 'some date',
        id: 'some-id-2',
        length: 3244,
        title: 'Mocked Track 2',
        titleInTheRecording: 'some title',
        video: true,
      },
    ]);
    expect(response.body.artist).toContain('Partial Mock Band');
  });

  it('should filter by artist after creation', async () => {
    const uniqueId = Math.random().toString(36).substring(2, 8);

    const createRecordDto = {
      artist: `Filter Band ${uniqueId}`,
      album: `Filtered Album ${uniqueId}`,
      price: 20,
      qty: 15,
      mbid: `mocked-mbid-${uniqueId}`,
      format: RecordFormat.CD,
      category: RecordCategory.JAZZ,
    };

    const createResponse = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    createdRecordIds.push(createResponse.body._id);

    const filterResponse = await request(app.getHttpServer())
      .get(`/records?artist=Filter Band ${uniqueId}`)
      .expect(200);

    expect(filterResponse.body[0].artist).toBe(`Filter Band ${uniqueId}`);
  });
});
