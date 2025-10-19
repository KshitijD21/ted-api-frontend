import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, AudioPlayer } from '@/lib/audio';
import { GeminiLiveClient } from '@/lib/gemini-client';
import { VectaraRAGService, VectaraSearchResult } from '@/lib/vectara-service';

/**
 * Voice Mode with RAG Hook - TypeScript implementation of Python's AudioLoopWithRAG
 *
 * This hook implements the complete voice-to-voice chat flow:
 * 1. User speaks → captured by microphone
 * 2. Silence detection → auto-processes after 1.5s silence
 * 3. Speech-to-text → transcribes audio
 * 4. RAG search → finds relevant context from Vectara
 * 5. Enhanced prompt → builds prompt with context
 * 6. Send to Gemini → sends text with context
 * 7. Gemini responds → receives audio response
 * 8. Play audio → plays through speakers
 *
 * Features:
 * - Interruption detection (speak while Gemini is talking)
 * - Conversation history tracking
 * - Audio level monitoring
 * - Automatic silence detection
 */

interface ConversationEntry {
  user: string;
  contextDocs: VectaraSearchResult[];
  enhancedPrompt: string;
  timestamp: Date;
}

interface UseVoiceModeWithRAGOptions {
  apiKey: string;
  ragEnabled?: boolean;
  numResults?: number;
  maxResponseWords?: number;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export function useVoiceModeWithRAGEnhanced(options: UseVoiceModeWithRAGOptions) {
  const {
    apiKey,
    ragEnabled = true,
    numResults = 3,
    maxResponseWords = 100,
    onTranscript,
    onError
  } = options;

  // Core state
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isGeminiSpeaking, setIsGeminiSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [retrievedDocs, setRetrievedDocs] = useState<VectaraSearchResult[]>([]);

  // Service refs
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const geminiClientRef = useRef<GeminiLiveClient | null>(null);
  const ragServiceRef = useRef<VectaraRAGService | null>(null);

  // Audio processing refs
  const audioBufferRef = useRef<string[]>([]);
  const lastAudioTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelRef = useRef<number>(0);
  const interruptionBufferRef = useRef<string[]>([]);

  // Configuration
  const SILENCE_THRESHOLD = 1.5; // seconds
  const MIN_AUDIO_LENGTH = 2.0; // seconds
  const INTERRUPTION_THRESHOLD = 200; // RMS level
  const AUDIO_DETECTION_THRESHOLD = 100; // RMS level

  /**
   * Initialize RAG service
   */
  const initializeRAG = useCallback(() => {
    if (!ragEnabled) return null;

    const customerId = process.env.NEXT_PUBLIC_VECTARA_CUSTOMER_ID;
    const corpusId = process.env.NEXT_PUBLIC_VECTARA_CORPUS_ID;
    const ragApiKey = process.env.NEXT_PUBLIC_VECTARA_API_KEY;

    if (!customerId || !corpusId || !ragApiKey) {
      console.warn('⚠️ Vectara credentials not configured');
      return null;
    }

    return new VectaraRAGService(customerId, corpusId, ragApiKey);
  }, [ragEnabled]);

  /**
   * Transcribe audio using Web Speech API
   *
   * Note: We'll use continuous recognition on the live mic stream
   * and capture the transcript after silence is detected
   */
  const speechRecognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');

  const startContinuousRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('⚠️ Web Speech API not supported');
      return;
    }

    if (speechRecognitionRef.current) {
      console.log('🎤 Speech recognition already running');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update latest transcript
      if (finalTranscript) {
        latestTranscriptRef.current = finalTranscript.trim();
        console.log('📝 Final transcript:', latestTranscriptRef.current);
      } else if (interimTranscript) {
        console.log('📝 Interim:', interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        console.log('⚠️ No speech detected, restarting...');
        // Auto-restart on no-speech
        setTimeout(() => {
          if (speechRecognitionRef.current) {
            recognition.start();
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      // Auto-restart if we're still active
      if (isActive && speechRecognitionRef.current) {
        console.log('🔄 Restarting speech recognition...');
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            console.error('Failed to restart recognition:', err);
          }
        }, 100);
      }
    };

    try {
      recognition.start();
      speechRecognitionRef.current = recognition;
      console.log('✅ Speech recognition started');
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
    }
  }, [isActive]);

  const stopContinuousRecognition = useCallback(() => {
    if (speechRecognitionRef.current) {
      console.log('🛑 Stopping speech recognition');
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
  }, []);

  const getLatestTranscript = useCallback((): string => {
    const transcript = latestTranscriptRef.current;
    latestTranscriptRef.current = ''; // Clear after reading
    return transcript;
  }, []);

  /**
   * Process query with RAG retrieval
   */
  const processWithRAG = useCallback(async (userText: string): Promise<string> => {
    if (!userText.trim()) return userText;

    const ragService = ragServiceRef.current;
    if (!ragService) {
      console.log('ℹ️ RAG disabled, using original text');
      return userText;
    }

    try {
      console.log('🔍 Searching knowledge base for:', userText);

      // Search Vectara
      const docs = await ragService.search(userText, numResults);

      if (docs.length > 0) {
        console.log(`✅ Found ${docs.length} relevant documents`);
        setRetrievedDocs(docs);

        // Log retrieved documents
        docs.forEach((doc, i) => {
          console.log(`  ${i + 1}. Score: ${doc.score.toFixed(3)} - ${doc.text.substring(0, 100)}...`);
        });

        // Build enhanced prompt
        const enhancedPrompt = ragService.buildContextPrompt(userText, docs, maxResponseWords);

        // Store in conversation history
        const entry: ConversationEntry = {
          user: userText,
          contextDocs: docs,
          enhancedPrompt,
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, entry]);

        return enhancedPrompt;
      } else {
        console.log('⚠️ No relevant documents found');
        setRetrievedDocs([]);
        return userText;
      }
    } catch (error) {
      console.error('❌ RAG search error:', error);
      return userText;
    }
  }, [numResults, maxResponseWords]);

  /**
   * Detect interruption based on audio level
   */
  const detectInterruption = useCallback((audioData: string): boolean => {
    if (!isGeminiSpeaking) return false;

    // Add to interruption buffer
    interruptionBufferRef.current.push(audioData);

    // Keep buffer size manageable (2 seconds max)
    const maxBufferSize = 32; // approximately 2 seconds at 16kHz
    if (interruptionBufferRef.current.length > maxBufferSize) {
      interruptionBufferRef.current.shift();
    }

    // Check if audio level is high enough for interruption
    if (audioLevelRef.current > INTERRUPTION_THRESHOLD) {
      console.log('🛑 Interruption detected! Audio level:', audioLevelRef.current);
      return true;
    }

    return false;
  }, [isGeminiSpeaking]);

  /**
   * Handle audio chunk from recorder
   */
  const handleAudioChunk = useCallback(async (base64Audio: string) => {
    const currentTime = Date.now();

    // Check for interruption
    const isInterruption = detectInterruption(base64Audio);
    if (isInterruption) {
      console.log('🛑 Stopping Gemini due to interruption');
      setIsGeminiSpeaking(false);

      // Stop audio playback
      if (playerRef.current) {
        playerRef.current.stop();
      }

      // Use interruption buffer as start of new recording
      audioBufferRef.current = [...interruptionBufferRef.current];
      interruptionBufferRef.current = [];
      setIsRecording(true);
      lastAudioTimeRef.current = currentTime;
      return;
    }

    // Add to audio buffer
    audioBufferRef.current.push(base64Audio);
    lastAudioTimeRef.current = currentTime;

    // Check if we have enough audio (MIN_AUDIO_LENGTH seconds)
    const estimatedDuration = audioBufferRef.current.length * 0.064; // rough estimate

    if (!isRecording && audioLevelRef.current > AUDIO_DETECTION_THRESHOLD) {
      console.log('🎤 Started recording (level:', audioLevelRef.current, ')');
      setIsRecording(true);
    }

    // Clear existing silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Set silence timer
    silenceTimerRef.current = setTimeout(async () => {
      if (estimatedDuration >= MIN_AUDIO_LENGTH && audioBufferRef.current.length > 0) {
        console.log(`🔄 Processing audio (duration: ${estimatedDuration.toFixed(1)}s)`);

        // Get latest transcript from continuous speech recognition
        const userText = getLatestTranscript();

        if (userText && userText.trim().length > 3) {
          console.log(`📝 You said: "${userText}"`);
          setCurrentTranscript(userText);
          onTranscript?.(userText, true);

          console.log('🔍 Searching knowledge base...');

          // Process with RAG
          try {
            const enhancedPrompt = await processWithRAG(userText);

            console.log('🤖 Sending to Gemini...');

            // Send to Gemini as text
            if (geminiClientRef.current) {
              await geminiClientRef.current.sendTextInput(enhancedPrompt);
            }
          } catch (error) {
            console.error('❌ Error processing with RAG:', error);
            onError?.(error as Error);
          }
        } else {
          console.log(`❌ No transcript available or too short: "${userText}"`);
          console.log('💡 Try speaking louder or more clearly');
        }

        // Reset buffer
        audioBufferRef.current = [];
        setIsRecording(false);
      }
    }, SILENCE_THRESHOLD * 1000);
  }, [detectInterruption, getLatestTranscript, processWithRAG, onTranscript, onError]);

  /**
   * Handle silence detected by recorder
   */
  const handleSilence = useCallback(() => {
    console.log('🤫 Silence detected');
    // Handled by silence timer in handleAudioChunk
  }, []);

  /**
   * Start voice mode with RAG
   */
  const start = useCallback(async () => {
    try {
      console.log('🚀 Starting Voice Mode with RAG...');

      // Initialize RAG service
      ragServiceRef.current = initializeRAG();

      if (ragServiceRef.current) {
        console.log('✅ RAG-enhanced voice chat enabled');
        console.log('🔍 The system will search your knowledge base for relevant context');
      } else {
        console.log('⚠️ RAG disabled - check Vectara credentials');
      }

      // Initialize Gemini client
      const client = new GeminiLiveClient(apiKey, {
        onTranscript: (text, isFinal) => {
          console.log('🤖 Gemini transcript:', text, 'isFinal:', isFinal);
          onTranscript?.(text, isFinal);
        },
        onAudio: async (audioData) => {
          // Play audio response
          if (playerRef.current) {
            setIsGeminiSpeaking(true);
            await playerRef.current.playBase64Audio(audioData, () => {
              setIsGeminiSpeaking(false);
              console.log('✅ Gemini finished speaking');
            });
          }
        },
        onError: (error) => {
          console.error('❌ Gemini error:', error);
          onError?.(error);
        },
        onConnected: () => {
          console.log('✅ Connected to Gemini Live API');
          setIsConnected(true);
        },
        onDisconnected: () => {
          console.log('🔌 Disconnected from Gemini');
          setIsConnected(false);
        }
      });

      await client.connect();
      geminiClientRef.current = client;

      // Initialize audio recorder
      const recorder = new AudioRecorder();
      await recorder.requestPermission();
      await recorder.start(handleAudioChunk, handleSilence);
      recorderRef.current = recorder;

      // Initialize audio player
      const player = new AudioPlayer();
      playerRef.current = player;

      // Start continuous speech recognition
      startContinuousRecognition();

      setIsActive(true);
      console.log('✅ Voice Mode with RAG started successfully');
      console.log('🎤 Speak into your microphone');
      console.log('💡 Using headphones is recommended to prevent feedback');

    } catch (error) {
      console.error('❌ Failed to start voice mode:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [apiKey, initializeRAG, handleAudioChunk, handleSilence, startContinuousRecognition, onTranscript, onError]);

  /**
   * Stop voice mode
   */
  const stop = useCallback(async () => {
    console.log('🛑 Stopping Voice Mode with RAG...');

    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop speech recognition
    stopContinuousRecognition();

    // Stop recorder
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    // Stop player
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current.cleanup();
      playerRef.current = null;
    }

    // Disconnect Gemini
    if (geminiClientRef.current) {
      await geminiClientRef.current.disconnect();
      geminiClientRef.current = null;
    }

    // Reset state
    setIsActive(false);
    setIsConnected(false);
    setIsRecording(false);
    setIsGeminiSpeaking(false);
    setAudioLevel(0);
    setCurrentTranscript('');
    audioBufferRef.current = [];
    interruptionBufferRef.current = [];

    console.log('✅ Voice Mode with RAG stopped');
  }, [stopContinuousRecognition]);

  /**
   * Monitor audio level updates
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (recorderRef.current && recorderRef.current.isRecording()) {
        // Audio level is updated in handleAudioChunk
        setAudioLevel(audioLevelRef.current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isActive) {
        stop();
      }
    };
  }, [isActive, stop]);

  return {
    // State
    isActive,
    isConnected,
    isRecording,
    isGeminiSpeaking,
    audioLevel,
    currentTranscript,
    conversationHistory,
    retrievedDocs,

    // Actions
    start,
    stop,

    // Computed
    isRAGEnabled: ragServiceRef.current !== null
  };
}
