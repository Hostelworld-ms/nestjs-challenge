export enum RecordFormat {
  VINYL = 'Vinyl',
  CD = 'CD',
  CASSETTE = 'Cassette',
  DIGITAL = 'Digital',
}

export enum RecordCategory {
  ROCK = 'Rock',
  JAZZ = 'Jazz',
  HIPHOP = 'Hip-Hop',
  CLASSICAL = 'Classical',
  POP = 'Pop',
  ALTERNATIVE = 'Alternative',
  INDIE = 'Indie',
}

export interface TrackList {
  title?: string;
  firstReleaseDate: string;
  disambiguation: string;
  video: boolean;
  length: number;
  titleInTheRecording?: string;
  id: string;
}
