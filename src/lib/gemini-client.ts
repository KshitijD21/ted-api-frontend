import { GoogleGenAI, Modality } from '@google/genai';

/**
 * Gemini Live API Client
 *
 * This client uses the official @google/genai SDK to connect to Gemini Live API.
 *
 * Model: gemini-2.0-flash-live-001
 * - This is the latest Live API model with improved function calling and conversational accuracy
 * - Supports bidirectional audio streaming and live transcription
 * - Best for applications with backend processing between user input and model output
 *
 * Alternative model: gemini-2.5-flash-native-audio-preview-09-2025
 * - Use this for pure native audio processing without intermediate steps
 *
 * For more details, see: https://ai.google.dev/gemini-api/docs/live
 */

export interface GeminiClientCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudio: (audioData: string) => void; // base64 audio
  onError: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export class GeminiLiveClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any = null;
  private isConnected = false;
  private callbacks: GeminiClientCallbacks;
  private apiKey: string;
  constructor(apiKey: string, callbacks: GeminiClientCallbacks) {
    this.apiKey = apiKey;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to Gemini Live');
      return;
    }

    try {
      // Use v1alpha API version as required by Live API
      const ai = new GoogleGenAI({
        apiKey: this.apiKey,
        apiVersion: 'v1beta' // Correct parameter name
      });

      console.log('Connecting to Gemini Live API...');

      const config = {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      };

      this.session = await ai.live.connect({
        model: 'gemini-2.0-flash-live-001', // Updated to latest model
        config: config,
        callbacks: {
          onopen: () => {
            console.log('WebSocket connection opened');
            this.isConnected = true;
            this.callbacks.onConnected?.();
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onmessage: (message: any) => {
            console.log('Received message:', message);
            this.handleMessage(message);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onerror: (error: any) => {
            console.error('WebSocket error:', error);
            this.callbacks.onError(new Error(error.message || error.error || 'WebSocket error'));
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onclose: (closeEvent: any) => {
            console.log('WebSocket connection closed:', closeEvent.reason || 'Unknown reason');
            this.isConnected = false;
            this.callbacks.onDisconnected?.();
          }
        }
      });

      console.log('Gemini Live API connected successfully');
    } catch (error) {
      console.error('Failed to connect to Gemini:', error);
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onError(errorObj);
      throw errorObj;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(message: any): void {
    try {
      // console.log('🔵 RAW MESSAGE RECEIVED:', JSON.stringify(message, null, 2));

      // Handle server content as per official API documentation
      if (message.serverContent) {
        const content = message.serverContent;
        // console.log('📦 SERVER CONTENT:', JSON.stringify(content, null, 2));

        // Handle INPUT transcription (user's speech being transcribed)
        if (content.inputTranscription) {
          console.log('🎤 USER TRANSCRIPT:', content.inputTranscription.text,
                      'isFinal:', content.inputTranscription.isFinal);
          this.callbacks.onTranscript(
            content.inputTranscription.text || '',
            content.inputTranscription.isFinal || false
          );
        }

        // Handle OUTPUT transcription (model's speech transcription)
        if (content.outputTranscription) {
          console.log('🤖 MODEL TRANSCRIPT:', content.outputTranscription.text);
        }

        // ✅ CORRECT: Extract audio from modelTurn.parts[]
        if (content.modelTurn?.parts) {
          console.log('🎵 MODEL TURN PARTS:', content.modelTurn.parts.length, 'parts');

          for (const part of content.modelTurn.parts) {
            console.log('📍 PART TYPE:', Object.keys(part));

            // Audio comes as inlineData with mimeType "audio/pcm"
            if (part.inlineData) {
              console.log('🔊 AUDIO DATA FOUND:');
              console.log('   - MIME Type:', part.inlineData.mimeType);
              console.log('   - Data length:', part.inlineData.data?.length || 0, 'chars');

              if (part.inlineData.mimeType?.includes('audio/pcm')) {
                // This is the 24kHz PCM audio from Gemini
                this.callbacks.onAudio(part.inlineData.data);
              }
            }

            // Handle text responses
            if (part.text) {
              console.log('💬 TEXT RESPONSE:', part.text);
            }
          }
        }

        // Handle interruption events
        if (content.interrupted) {
          console.log('⚠️ Generation was interrupted');
        }

        // Handle turn completion
        if (content.turnComplete) {
          console.log('✅ Turn complete');
        }
      }

      // Handle usage metadata
      if (message.usageMetadata) {
        console.log('📊 Token usage:', message.usageMetadata.totalTokenCount);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      this.callbacks.onError(error as Error);
    }
  }

  async sendRealtimeInput(audioData: string): Promise<void> {
    if (!this.isConnected || !this.session) {
      throw new Error('Not connected to Gemini');
    }

    try {
      // Send audio using the correct session.sendRealtimeInput method as per official docs
      this.session.sendRealtimeInput({
        media: {
          data: audioData,
          mimeType: "audio/pcm;rate=16000"
        }
      });
    } catch (error) {
      console.error('Error sending audio:', error);
      this.callbacks.onError(error as Error);
    }
  }

  async sendTurnComplete(): Promise<void> {
    if (!this.isConnected || !this.session) {
      throw new Error('Not connected to Gemini');
    }

    try {
      console.log('🔄 Sending turn complete signal');
      // Signal that the user's turn is complete
      this.session.sendRealtimeInput({ turnComplete: true });
    } catch (error) {
      console.error('Error sending turn complete:', error);
      this.callbacks.onError(error as Error);
    }
  }

  async sendClientContent(text: string): Promise<void> {
    if (!this.isConnected || !this.session) {
      throw new Error('Not connected to Gemini');
    }

    try {
      // Send text message using the correct session.sendClientContent method as per official docs
      this.session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      });
    } catch (error) {
      console.error('Error sending text:', error);
      this.callbacks.onError(error as Error);
    }
  }

  /**
   * ✅ NEW: Send text input (Python-style naming)
   * This matches Python's session.send(input=text, end_of_turn=True)
   */
  async sendTextInput(text: string): Promise<void> {
    if (!this.isConnected || !this.session) {
      throw new Error('Not connected to Gemini');
    }

    try {
      console.log('📤 Sending text to Gemini:', text.substring(0, 100) + '...');

      // Send text with turnComplete flag (like Python's end_of_turn)
      this.session.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      });

      console.log('✅ Text sent with turnComplete=true');
    } catch (error) {
      console.error('Error sending text:', error);
      this.callbacks.onError(error as Error);
    }
  }

  async sendAudioStreamEnd(): Promise<void> {
    if (!this.isConnected || !this.session) {
      throw new Error('Not connected to Gemini');
    }

    try {
      // Send audio stream end event as per official docs
      this.session.sendRealtimeInput({ audioStreamEnd: true });
    } catch (error) {
      console.error('Error sending audio stream end:', error);
      this.callbacks.onError(error as Error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      try {
        this.session.close();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.session = null;
    }
    this.isConnected = false;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export async function connectToGemini(
  apiKey: string,
  callbacks: GeminiClientCallbacks
): Promise<GeminiLiveClient> {
  const client = new GeminiLiveClient(apiKey, callbacks);
  await client.connect();
  return client;
}
