import { Injectable, Logger } from '@nestjs/common';

export function extractTracklist(releaseData): { title: string }[] {
  if (!releaseData?.media) return [];

  return releaseData.media.flatMap((medium) =>
    (medium.tracks || []).map((track) => ({
      title: track.title,
    })),
  );
}

@Injectable()
export class MusicBrainzService {
  baseUrl: string;
  userAgent: string;
  private readonly logger = new Logger(MusicBrainzService.name);

  constructor() {
    this.userAgent = `NestJS-MusicApp/1.0.0@${new Date().toISOString()}`;
    this.baseUrl = 'https://musicbrainz.org/ws/2/';
  }

  async getReleaseTrackList(releaseMbid: string): Promise<string[]> {
    const url = new URL(`release/${releaseMbid}`, this.baseUrl);
    url.searchParams.append('inc', 'recordings+media');
    url.searchParams.append('fmt', 'json');

    const res = await fetch(url.href, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': this.userAgent,
      },
    });

    if (!res.ok) {
      this.logger.error(
        `Could not find release tracklist for MBID: ${releaseMbid}`,
      );
      const errorText = await res.text();
      this.logger.error(`Response status: ${res.status} error: ${errorText}`);
      return [];
    }

    const data = await res.json();
    return extractTracklist(data).map((e) => e.title);
  }
}
