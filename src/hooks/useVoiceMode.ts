'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceState, TranscriptSegment } from '@/types';
import { AudioRecorder, AudioPlayer, closeSharedAudioContext } from '@/lib/audio';
import { GeminiLiveClient, connectToGemini } from '@/lib/gemini-client';
import { toast } from 'sonner';

export interface UseVoiceModeReturn {
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
}

export function useVoiceMode(): UseVoiceModeReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const geminiClientRef = useRef<GeminiLiveClient | null>(null);
  const isActiveRef = useRef(false);

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
      toast.error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
      return false;
    }

    try {

      // Request microphone permission
      const hasPermission = await recorderRef.current?.requestPermission();
      if (!hasPermission) {
        toast.error('Microphone permission denied. Please allow microphone access.');
        return false;
      }

      // Connect to Gemini Live API
      toast.info('Connecting to Gemini Live...');

      geminiClientRef.current = await connectToGemini(apiKey, {
        onTranscript: (text, isFinal) => {
          setCurrentTranscript(text);
          if (isFinal && text.trim()) {
            setTranscript(prev => [...prev, {
              text,
              isFinal: true,
              timestamp: new Date()
            }]);
            setCurrentTranscript('');
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
          console.error('Gemini error:', error);
          toast.error(`Error: ${error.message}`);
        },
        onConnected: () => {
          setIsConnected(true);
          toast.success('Voice mode activated!');
        },
        onDisconnected: () => {
          setIsConnected(false);
          if (isActiveRef.current) {
            toast.error('Disconnected from Gemini');
            stopVoiceMode();
          }
        },
      });

      // Start recording and streaming to Gemini with silence detection
      await recorderRef.current?.start(
        async (base64Data) => {
          if (geminiClientRef.current?.getIsConnected()) {
            try {
              await geminiClientRef.current.sendRealtimeInput(base64Data);
            } catch (error) {
              console.error('Error sending audio to Gemini:', error);
            }
          }
        },
        async () => {
          // Silence detected - send turn complete to Gemini
          if (geminiClientRef.current?.getIsConnected()) {
            try {
              await geminiClientRef.current.sendTurnComplete();
              console.log('🔄 Turn completed due to silence');
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
      console.error('Failed to start voice mode:', error);
      toast.error(`Failed to start voice mode: ${errorMessage}`);
      setVoiceState('idle');
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopVoiceMode = useCallback(async () => {
    isActiveRef.current = false;

    // Send audio stream end to Gemini before disconnecting
    if (geminiClientRef.current?.getIsConnected()) {
      try {
        await geminiClientRef.current.sendAudioStreamEnd();
      } catch (error) {
        console.error('Error sending audio stream end:', error);
      }
    }

    recorderRef.current?.stop();
    playerRef.current?.stop();
    geminiClientRef.current?.disconnect();
    geminiClientRef.current = null;
    setVoiceState('idle');
    setCurrentTranscript('');
    setIsConnected(false);
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
      await geminiClientRef.current.sendClientContent(text);
    }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
      console.log('🎚️ Audio playback speed adjusted to:', speed);
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
  };
}
