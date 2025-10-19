import { WebSocketMessage } from '@/types';
import { WS_CONFIG } from './constants';

type WebSocketEventHandler = {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAudio?: (audioData: ArrayBuffer) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export class GeminiWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private handlers: WebSocketEventHandler = {};
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(handlers: WebSocketEventHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      this.handlers = handlers;

      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startPing();
          this.handlers.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          const error = new Error('WebSocket connection error');
          this.handlers.onError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.cleanup();
          this.handlers.onClose?.();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      if (event.data instanceof ArrayBuffer) {
        // Audio data from TTS
        this.handlers.onAudio?.(event.data);
      } else {
        // JSON message
        const message: WebSocketMessage = JSON.parse(event.data);

        if (message.type === 'transcript' && message.text) {
          this.handlers.onTranscript?.(message.text, message.isFinal ?? false);
        } else if (message.type === 'audio' && message.data && typeof message.data === 'string') {
          const audioBuffer = this.base64ToArrayBuffer(message.data);
          this.handlers.onAudio?.(audioBuffer);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }

  sendText(text: string, type: 'query' | 'tts' = 'query'): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: type === 'tts' ? 'tts' : 'control',
        text,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendControl(command: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'control',
        data: { command },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, WS_CONFIG.pingInterval);
  }

  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.handlers.onError?.(new Error('Failed to reconnect to WebSocket'));
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${WS_CONFIG.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.handlers).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, WS_CONFIG.reconnectDelay);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
