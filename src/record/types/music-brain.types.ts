type Recording = {
  disambiguation: string;
  'first-release-date': string;
  video: boolean;
  title: string;
};

type MusicBrainResponseTrack = {
  position: number;
  title: string;
  length: number;
  recording: Recording;
  id: string;
};
type Media = {
  tracks: MusicBrainResponseTrack[];
};

export type MusicBrainRecordResponse = {
  media: Media[];
};
