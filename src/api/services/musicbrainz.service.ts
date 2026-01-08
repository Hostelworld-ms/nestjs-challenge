import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class MusicBrainzService {
  private readonly BASE_URL = 'https://musicbrainz.org/ws/2';

  async fetchTracklistByMbid(mbid: string): Promise<string[]> {
    try {
      const url = `${this.BASE_URL}/release/${mbid}?inc=recordings&fmt=xml`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'BrokenRecordStore/1.0 (challenge)',
        },
        timeout: 5000,
      });

      const parser = new XMLParser();
      const parsed = parser.parse(response.data);

      const media = parsed?.metadata?.release?.mediumList?.medium;
      if (!media) return [];

      const tracks: string[] = [];

      const mediums = Array.isArray(media) ? media : [media];
      for (const m of mediums) {
        const trackList = m?.trackList?.track;
        if (!trackList) continue;

        const tracksArray = Array.isArray(trackList) ? trackList : [trackList];
        for (const t of tracksArray) {
          if (t?.recording?.title) {
            tracks.push(t.recording.title);
          }
        }
      }

      return tracks;
    } catch (error) {
      console.error('MusicBrainz API error:', error.message);
      throw new InternalServerErrorException(
        'Failed to fetch data from MusicBrainz',
      );
    }
  }
}
