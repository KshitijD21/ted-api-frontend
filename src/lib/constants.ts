// Color scheme
export const COLORS = {
  ai: {
    primary: '#4A90E2', // Maya Blue
    light: '#6BA3E8',
    dark: '#3A7BC8',
    bg: 'rgba(74, 144, 226, 0.1)',
  },
  user: {
    primary: '#708090', // Slate Gray
    light: '#8FA2B3',
    dark: '#5A6A7A',
    bg: 'rgba(112, 128, 144, 0.1)',
  },
  accent: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
} as const;

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// WebSocket configuration
export const WS_CONFIG = {
  reconnectDelay: 3000,
  maxReconnectAttempts: 5,
  pingInterval: 30000,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  search: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/search',
  repos: '/api/repos',
} as const;

// Audio configuration
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
} as const;
