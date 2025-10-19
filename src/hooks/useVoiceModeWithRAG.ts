/**
 * Enhanced Voice Mode Hook with Vectara RAG Integration
 *
 * This provides voice interaction with automatic RAG enhancement:
 * 1. Records audio
 * 2. Sends to Gemini for transcription
 * 3. Enhances with Vectara context
 * 4. Sends enhanced prompt back to Gemini
 * 5. Receives and plays audio response
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceState, TranscriptSegment } from '@/types';
import { AudioRecorder, AudioPlayer, closeSharedAudioContext } from '@/lib/audio';
import { GeminiLiveClient, connectToGemini } from '@/lib/gemini-client';
import { useVectaraRAG } from './useVectaraRAG';
import { toast } from 'sonner';

export interface UseVoiceModeWithRAGReturn {
  voiceState: VoiceState;
  currentTranscript: string;
  transcript: TranscriptSegment[];
  startVoiceMode: () => Promise<boolean>;
  stopVoiceMode: () => void;
  setThinking: () => void;
  resetToListening: () => void;
  sendTextForTTS: (text: string) => Promise<void>;
  setPlaybackSpeed: (speed: number) => void;
  isConnected: boolean;
  ragEnabled: boolean;
  setRAGEnabled: (enabled: boolean) => void;
}

export function useVoiceModeWithRAG(): UseVoiceModeWithRAGReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [ragEnabled, setRAGEnabled] = useState(true);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const geminiClientRef = useRef<GeminiLiveClient | null>(null);
  const isActiveRef = useRef(false);
  const pendingTranscriptRef = useRef<string>('');

  // ✅ Initialize Vectara RAG
  const { enhanceQueryWithRAG } = useVectaraRAG({
    enabled: ragEnabled,
    numResults: 3,
    maxResponseWords: 100
  });

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    playerRef.current = new AudioPlayer();

    return () => {
      recorderRef.current?.stop();
      playerRef.current?.cleanup();
      geminiClientRef.current?.disconnect();
      closeSharedAudioContext();
    };
  }, []);

  const startVoiceMode = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Gemini API key not configured');
      return false;
    }

    try {
      // Request microphone permission
      const hasPermission = await recorderRef.current?.requestPermission();
      if (!hasPermission) {
        toast.error('Microphone permission denied');
        return false;
      }

      // Connect to Gemini Live API
      toast.info('Connecting to Gemini Live...');

      geminiClientRef.current = await connectToGemini(apiKey, {
        onTranscript: async (text, isFinal) => {
          console.log('📝 [VoiceRAG] Transcript:', text, 'Final:', isFinal);
          setCurrentTranscript(text);

          if (isFinal && text.trim()) {
            console.log('✅ [VoiceRAG] Final transcript received:', text);

            // Add to transcript history
            setTranscript(prev => [...prev, {
              text,
              isFinal: true,
              timestamp: new Date()
            }]);

            // Store for RAG enhancement
            pendingTranscriptRef.current = text;
            setCurrentTranscript('');

            // ✅ CRITICAL: Enhance with Vectara RAG before responding
            if (ragEnabled) {
              console.log('🔍 [VoiceRAG] Enhancing with Vectara...');
              setVoiceState('thinking');

              try {
                const enhanced = await enhanceQueryWithRAG(text);

                if (enhanced.hasContext) {
                  console.log('✨ [VoiceRAG] Enhanced with context from Vectara');
                  console.log(`📚 [VoiceRAG] Using ${enhanced.retrievedDocs.length} documents`);

                  toast.success(`Enhanced with ${enhanced.retrievedDocs.length} sources`, {
                    duration: 2000
                  });

                  // Send enhanced prompt to Gemini for audio response
                  console.log('📤 [VoiceRAG] Sending enhanced prompt to Gemini');
                  await geminiClientRef.current?.sendTextInput(enhanced.enhancedPrompt);
                } else {
                  console.log('ℹ️ [VoiceRAG] No Vectara context, using original query');
                  // Still send to Gemini but without RAG context
                  await geminiClientRef.current?.sendTextInput(text);
                }
              } catch (error) {
                console.error('❌ [VoiceRAG] RAG enhancement failed:', error);
                // Fallback to original query
                await geminiClientRef.current?.sendTextInput(text);
              }
            }
          }
        },
        onAudio: async (base64Audio) => {
          setVoiceState('speaking');
          await playerRef.current?.playBase64Audio(base64Audio, () => {
            if (isActiveRef.current) {
              setVoiceState('listening');
            }
          });
        },
        onError: (error) => {
          console.error('❌ [VoiceRAG] Gemini error:', error);
          toast.error(`Error: ${error.message}`);
        },
        onConnected: () => {
          setIsConnected(true);
          const message = ragEnabled
            ? 'Voice mode with RAG activated!'
            : 'Voice mode activated!';
          toast.success(message);
        },
        onDisconnected: () => {
          setIsConnected(false);
          if (isActiveRef.current) {
            toast.error('Disconnected from Gemini');
            stopVoiceMode();
          }
        },
      });

      // Start recording and streaming to Gemini
      await recorderRef.current?.start(
        async (base64Data) => {
          if (geminiClientRef.current?.getIsConnected()) {
            try {
              await geminiClientRef.current.sendRealtimeInput(base64Data);
            } catch (error) {
              console.error('Error sending audio:', error);
            }
          }
        },
        async () => {
          // Silence detected - send turn complete
          if (geminiClientRef.current?.getIsConnected()) {
            try {
              await geminiClientRef.current.sendTurnComplete();
              console.log('🔄 [VoiceRAG] Turn completed due to silence');
            } catch (error) {
              console.error('Error sending turn complete:', error);
            }
          }
        }
      );

      setVoiceState('listening');
      isActiveRef.current = true;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [VoiceRAG] Failed to start:', error);
      toast.error(`Failed to start: ${errorMessage}`);
      setVoiceState('idle');
      return false;
    }
  }, [ragEnabled, enhanceQueryWithRAG]);

  const stopVoiceMode = useCallback(async () => {
    isActiveRef.current = false;

    if (geminiClientRef.current?.getIsConnected()) {
      try {
        await geminiClientRef.current.sendAudioStreamEnd();
      } catch (error) {
        console.error('Error ending stream:', error);
      }
    }

    recorderRef.current?.stop();
    playerRef.current?.stop();
    geminiClientRef.current?.disconnect();
    geminiClientRef.current = null;
    setVoiceState('idle');
    setCurrentTranscript('');
    setIsConnected(false);
    pendingTranscriptRef.current = '';
  }, []);

  const setThinking = useCallback(() => {
    setVoiceState('thinking');
  }, []);

  const resetToListening = useCallback(() => {
    if (isActiveRef.current) {
      setVoiceState('listening');
    }
  }, []);

  const sendTextForTTS = useCallback(async (text: string) => {
    if (geminiClientRef.current?.getIsConnected()) {
      // Option to enhance text queries with RAG too
      if (ragEnabled) {
        const enhanced = await enhanceQueryWithRAG(text);
        await geminiClientRef.current.sendTextInput(enhanced.enhancedPrompt);
      } else {
        await geminiClientRef.current.sendClientContent(text);
      }
    }
  }, [ragEnabled, enhanceQueryWithRAG]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
      console.log('🎚️ Playback speed:', speed);
    }
  }, []);

  return {
    voiceState,
    transcript,
    currentTranscript,
    startVoiceMode,
    stopVoiceMode,
    setThinking,
    resetToListening,
    sendTextForTTS,
    setPlaybackSpeed,
    isConnected,
    ragEnabled,
    setRAGEnabled,
  };
}
