import { MusicBrainService } from './musicBrain.service';
import { MusicBrainRecordResponse } from '../types';

global.fetch = jest.fn();

describe('MusicBrainService', () => {
  let service: MusicBrainService;

  beforeEach(() => {
    service = new MusicBrainService();
    jest.clearAllMocks();
  });

  describe('fetch', () => {
    it('should return parsed JSON data when fetch is successful', async () => {
      const mockResponseData = { media: [] } as MusicBrainRecordResponse;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      });

      const result = await service.fetch('https://mock-url.com');
      expect(fetch).toHaveBeenCalledWith(
        'https://mock-url.com',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': 'PostmanRuntime/7.44.0',
          }),
        }),
      );
      expect(result).toEqual(mockResponseData);
    });

    it('should throw RequestError when fetch response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        body: 'Not Found',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(service.fetch('https://bad-url.com')).rejects.toThrow(
        'error occured while fetching data',
      );
    });

    it('should throw generic error on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );

      await expect(service.fetch('https://error-url.com')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getTrackList', () => {
    it('should return flattened track list from nested media', () => {
      const input: MusicBrainRecordResponse = {
        media: [
          {
            tracks: [
              {
                title: 'Track One',
                length: 180000,
                id: 't1',
                recording: {
                  'first-release-date': '2000-01-01',
                  disambiguation: '',
                  title: 'Track One Title',
                  video: false,
                },
                position: 0,
              },
            ],
          },
        ],
      };

      const result = service.getTrackList(input);

      expect(result).toEqual([
        {
          title: 'Track One',
          length: 180000,
          id: 't1',
          firstReleaseDate: '2000-01-01',
          disambiguation: '',
          titleInTheRecording: 'Track One Title',
          video: false,
        },
      ]);
    });

    it('should return an empty array if no media exists', () => {
      const result = service.getTrackList({ media: [] });
      expect(result).toEqual([]);
    });
  });
});
