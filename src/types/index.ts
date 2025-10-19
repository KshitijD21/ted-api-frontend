export type MessageRole = 'user' | 'assistant';

export interface Source {
  file: string;
  snippet: string;
  repo?: string;
  url?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: Source[];
  isComplete?: boolean;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'indexing' | 'error';
  lastIndexed?: Date;
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResponse {
  summary: string;
  sources: Source[];
}

export interface WebSocketMessage {
  type: 'audio' | 'transcript' | 'tts' | 'control';
  data?: ArrayBuffer | string | Record<string, unknown>;
  text?: string;
  isFinal?: boolean;
}

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface TranscriptSegment {
  text: string;
  isFinal: boolean;
  timestamp: Date;
}
