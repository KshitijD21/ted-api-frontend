/**
 * Chat types and interfaces for the RAG chat application
 */

export interface Source {
  file_path: string;
  file_name: string;
  file_type: string;
  repo: string;
  owner: string;
  source_url: string;
  relevance_score: number;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
  streaming?: boolean;
}

export interface ChatHistory {
  id: string;
  title: string; // First message or generated title
  messages: Message[];
  created_at: Date;
  updated_at: Date;
}

export interface ChatStore {
  conversations: ChatHistory[];
  activeConversationId: string | null;
}

export interface SearchResponse {
  query: string;
  summary: string;
  sources: Source[];
  total_results: number;
  query_time_ms: number;
  filters_applied: Record<string, any>;
}
