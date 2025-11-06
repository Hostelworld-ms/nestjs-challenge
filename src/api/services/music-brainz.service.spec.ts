import * as nock from 'nock';
import { extractTracklist, MusicBrainzService } from './music-brainz.service';

const mockMusicBrainzReleaseDataResponse = {
  media: [
    {
      'track-offset': 0,
      format: 'CD',
      tracks: [
        {
          length: 301920,
          id: 'afd6a9a6-40ef-3cd3-8e1d-95f0c156e7e3',
          recording: {
            length: 301133,
            video: false,
            disambiguation: '',
            'first-release-date': '1991-09-10',
            title: 'Smells Like Teen Spirit',
            id: '5fb524f1-8cc8-4c04-a921-e34c0a911ea7',
          },
          number: '1',
          position: 1,
          title: 'Smells Like Teen Spirit',
        },
        {
          recording: {
            disambiguation: 'Nevermind version',
            video: false,
            length: 255000,
            'first-release-date': '1991-09-24',
            title: 'In Bloom',
            id: '593e9317-a327-4a31-b796-416c62dcf49d',
          },
          number: '2',
          title: 'In Bloom',
          position: 2,
          length: 255080,
          id: '8a3d03d0-8223-3357-a241-5f56545c8a90',
        },
        {
          title: 'Come as You Are',
          position: 3,
          recording: {
            'first-release-date': '1991-09-24',
            disambiguation: 'original studio mix',
            length: 219026,
            video: false,
            id: '70ac6733-068f-4613-b06b-bea17cfbcc30',
            title: 'Come as You Are',
          },
          number: '3',
          id: '5351c20d-fcd6-3721-a0e7-2f599ce704db',
          length: 218920,
        },
        {
          title: 'Breed',
          position: 4,
          recording: {
            id: '0cf9f95f-70e7-4f2e-8075-5d8ba38dd4a3',
            title: 'Breed',
            'first-release-date': '1991-09-24',
            length: 183840,
            video: false,
            disambiguation: '',
          },
          number: '4',
          id: 'ababc18b-d853-3929-8c3a-5ff4e85f2764',
          length: 184040,
        },
        {
          position: 5,
          title: 'Lithium',
          number: '5',
          recording: {
            'first-release-date': '1991-09-24',
            video: false,
            length: 257000,
            disambiguation: '',
            id: '3fac712c-4196-4865-8c1a-94231a7da309',
            title: 'Lithium',
          },
          id: '5116763e-a028-33b9-8b91-de3db148d495',
          length: 257053,
        },
        {
          recording: {
            id: 'd088ed9e-1921-4568-ae75-fba8b15ed206',
            title: 'Polly',
            'first-release-date': '1991-09-24',
            video: false,
            length: 177000,
            disambiguation: '',
          },
          number: '6',
          position: 6,
          title: 'Polly',
          length: 177053,
          id: '2bb355d5-a676-3cc2-b177-a54653d01f5d',
        },
        {
          recording: {
            id: 'dbaa10b1-d46a-4960-8b50-4e2d80c8113c',
            title: 'Territorial Pissings',
            'first-release-date': '1991-09-24',
            disambiguation: '',
            length: 143000,
            video: false,
          },
          number: '7',
          title: 'Territorial Pissings',
          position: 7,
          length: 142946,
          id: 'd9c804ca-299d-3ee8-b987-cca0bea1c8ec',
        },
        {
          number: '8',
          recording: {
            disambiguation: '',
            video: false,
            length: 223880,
            'first-release-date': '1991-09-10',
            title: 'Drain You',
            id: '11cc49bd-f531-4cdd-9b59-e1f59b06c1d7',
          },
          title: 'Drain You',
          position: 8,
          length: 223880,
          id: '3003f943-5699-3997-8e66-a5d4542cddd0',
        },
        {
          id: '01629dad-2698-33db-8e85-71282e9ed2cc',
          length: 156893,
          title: 'Lounge Act',
          position: 9,
          number: '9',
          recording: {
            disambiguation: '',
            length: 156800,
            video: false,
            'first-release-date': '1991-09-24',
            title: 'Lounge Act',
            id: 'aef0677b-93b4-4c66-be74-10120d0e6f5a',
          },
        },
        {
          title: 'Stay Away',
          position: 10,
          number: '10',
          recording: {
            id: '8bf26383-8b9b-4252-9cb3-0efa4d3f47f1',
            title: 'Stay Away',
            'first-release-date': '1991-09-24',
            length: 212466,
            video: false,
            disambiguation: '',
          },
          id: '8c0ef677-f6f1-32a4-abc0-bd516a31a0c8',
          length: 212480,
        },
        {
          length: 196413,
          id: '3e2dd9d9-31a3-3e41-921d-f43aca404d20',
          number: '11',
          recording: {
            title: 'On a Plain',
            id: 'ea61d42b-9a76-47fd-bcf7-df911640c309',
            disambiguation: '',
            video: false,
            length: 196373,
            'first-release-date': '1991-09-24',
          },
          position: 11,
          title: 'On a Plain',
        },
        {
          position: 12,
          title: 'Something in the Way / Endless, Nameless',
          number: '12',
          recording: {
            title: 'Something in the Way / Endless, Nameless',
            id: 'd506a8b2-4ba9-49b9-941f-40d1295ebd29',
            video: false,
            length: 1235066,
            disambiguation: '',
            'first-release-date': '1991-09-24',
          },
          id: 'dcbb2238-3904-38ba-bb3b-e53163efd5cc',
          length: 1234906,
        },
      ],
      id: 'ef4e740f-8af6-344f-8e61-7b39e734c49e',
      'track-count': 12,
      title: '',
      'format-id': '9712d52a-4509-3d4b-a1a2-67c88c643e31',
      position: 1,
    },
  ],
};

describe('extractTracklist', () => {
  it('should return an empty array if no media is present', () => {
    const result = extractTracklist({});
    expect(result).toEqual([]);
  });

  it('should extract tracklist correctly from MBID 2feb350a-41c3-4358-addd-5b66ce2c34ba', () => {
    const result = extractTracklist(mockMusicBrainzReleaseDataResponse);
    expect(result.map((e) => e.title)).toEqual([
      'Smells Like Teen Spirit',
      'In Bloom',
      'Come as You Are',
      'Breed',
      'Lithium',
      'Polly',
      'Territorial Pissings',
      'Drain You',
      'Lounge Act',
      'Stay Away',
      'On a Plain',
      'Something in the Way / Endless, Nameless',
    ]);
  });
});

describe('MusicBrainzService', () => {
  let musicBrainzService: MusicBrainzService;

  beforeEach(() => {
    musicBrainzService = new MusicBrainzService();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getReleaseTrackList', () => {
    it('should fetch and return tracklist for a valid MBID', async () => {
      const validMbid = 'valid-mbid';

      nock(musicBrainzService.baseUrl)
        .get(`/release/${validMbid}`)
        .query(true)
        .reply(200, mockMusicBrainzReleaseDataResponse);

      const trackList = await musicBrainzService.getReleaseTrackList(validMbid);
      expect(trackList).toEqual([
        'Smells Like Teen Spirit',
        'In Bloom',
        'Come as You Are',
        'Breed',
        'Lithium',
        'Polly',
        'Territorial Pissings',
        'Drain You',
        'Lounge Act',
        'Stay Away',
        'On a Plain',
        'Something in the Way / Endless, Nameless',
      ]);
    });

    it('should return an empty array of tracklists if MusicBrainz request fails with 500', async () => {
      const mockMbid = 'invalid-mbid';

      nock(musicBrainzService.baseUrl)
        .get(`/release/${mockMbid}`)
        .query(true)
        .reply(500, { message: 'Unexpected error' });

      const trackList = await musicBrainzService.getReleaseTrackList(mockMbid);
      expect(trackList).toEqual([]);
    });
  });
});
