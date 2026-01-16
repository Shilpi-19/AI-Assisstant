
export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface Message {
  id: number;
  text: string;
  sender: Sender;
}

export interface GroundingSource {
    uri: string;
    title: string;
    startIndex?: number;
    endIndex?: number;
}

export enum AppState {
    Idle = 'idle',
    Recording = 'recording',
    Loading = 'loading', // waiting for AI text response
    Transcribing = 'transcribing', // transcribing final audio
    Speaking = 'speaking' // playing TTS audio
}
