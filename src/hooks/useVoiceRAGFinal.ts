import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioPlayer } from '@/lib/audio';
import { GeminiLiveClient } from '@/lib/gemini-client';
import { VectaraRAGService, VectaraSearchResult } from '@/lib/vectara-service';
import { SpeechRecognitionService } from '@/lib/speech-recognition';

/**
 * ✅ FINAL WORKING VERSION - Voice Mode with RAG
 *
 * This is the correct implementation matching Python's AudioLoopWithRAG
 *
 * Flow:
 * 1. User speaks → Web Speech API captures text in real-time
 * 2. After silence → final transcript captured
 * 3. Search Vectara for relevant context
 * 4. Build enhanced prompt with retrieved documents
 * 5. Send TEXT (not audio) to Gemini
 * 6. Receive audio response from Gemini
 * 7. Play audio through speakers
 *
 * Key Features:
 * - Real-time speech recognition
 * - Automatic RAG context retrieval
 * - Enhanced prompts with knowledge base context
 * - Audio responses from Gemini
 * - Conversation history tracking
 */

interface ConversationEntry {
  userQuestion: string;
  contextDocs: VectaraSearchResult[];
  enhancedPrompt: string;
  timestamp: Date;
}

interface UseVoiceRAGFinalOptions {
  apiKey: string;
  ragEnabled?: boolean;
  numResults?: number;
  maxResponseWords?: number;
  onError?: (error: Error) => void;
}

export function useVoiceRAGFinal(options: UseVoiceRAGFinalOptions) {
  const {
    apiKey,
    ragEnabled = true,
    numResults = 3,
    maxResponseWords = 100,
    onError
  } = options;

  // State
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGeminiSpeaking, setIsGeminiSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [retrievedDocs, setRetrievedDocs] = useState<VectaraSearchResult[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // Service refs
  const geminiClientRef = useRef<GeminiLiveClient | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const ragServiceRef = useRef<VectaraRAGService | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionService | null>(null);
  const stopRecognitionRef = useRef<(() => void) | null>(null);

  /**
   * Initialize RAG service
   */
  const initializeRAG = useCallback(() => {
    if (!ragEnabled) {
      console.log('ℹ️ RAG disabled by user');
      return null;
    }

    const customerId = process.env.NEXT_PUBLIC_VECTARA_CUSTOMER_ID;
    const corpusId = process.env.NEXT_PUBLIC_VECTARA_CORPUS_ID;
    const ragApiKey = process.env.NEXT_PUBLIC_VECTARA_API_KEY;

    console.log('🔧 Vectara config check:', {
      customerIdSet: !!customerId,
      corpusIdSet: !!corpusId,
      apiKeySet: !!ragApiKey,
      customerId: customerId?.substring(0, 5) + '...',
      corpusId
    });

    if (!customerId || !corpusId || !ragApiKey) {
      console.warn('⚠️ Vectara credentials missing in environment variables');
      setStatusMessage('⚠️ RAG disabled: Check .env.local');
      return null;
    }

    console.log('✅ Initializing Vectara RAG service');
    const service = new VectaraRAGService(customerId, corpusId, ragApiKey);
    setStatusMessage('✅ RAG service initialized');
    return service;
  }, [ragEnabled]);

  /**
   * Process query with RAG
   */
  const processWithRAG = useCallback(async (userText: string): Promise<string> => {
    if (!userText.trim()) {
      console.warn('⚠️ Empty user text, skipping RAG');
      return userText;
    }

    const ragService = ragServiceRef.current;
    if (!ragService) {
      console.log('ℹ️ RAG service not available, using original text');
      return userText + `\n\nPlease keep your response under ${maxResponseWords} words and be concise.`;
    }

    try {
      setStatusMessage('🔍 Searching knowledge base...');
      console.log('\n📚 === RAG SEARCH STARTING ===');
      console.log('🔍 Query:', userText);

      // Search Vectara
      const docs = await ragService.search(userText, numResults);

      console.log(`📊 Vectara returned ${docs.length} documents`);

      if (docs.length > 0) {
        console.log('✅ Retrieved documents:');
        docs.forEach((doc, i) => {
          console.log(`\n📄 Document ${i + 1}:`);
          console.log(`   Score: ${doc.score.toFixed(3)}`);
          console.log(`   Text: ${doc.text.substring(0, 150)}...`);
          console.log(`   Metadata:`, doc.metadata);
        });

        setRetrievedDocs(docs);

        // Build enhanced prompt with context
        const enhancedPrompt = ragService.buildContextPrompt(userText, docs, maxResponseWords);

        console.log('\n✨ Enhanced prompt created:');
        console.log('📏 Length:', enhancedPrompt.length, 'characters');
        console.log('📝 Preview:', enhancedPrompt.substring(0, 200) + '...');
        console.log('=== RAG SEARCH COMPLETE ===\n');

        // Store in conversation history
        const entry: ConversationEntry = {
          userQuestion: userText,
          contextDocs: docs,
          enhancedPrompt,
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, entry]);
        setStatusMessage(`✅ Found ${docs.length} relevant docs`);

        return enhancedPrompt;
      } else {
        console.log('⚠️ No relevant documents found in Vectara');
        console.log('💡 Using original query without context');
        console.log('=== RAG SEARCH COMPLETE (no results) ===\n');

        setRetrievedDocs([]);
        setStatusMessage('⚠️ No context found');

        // Return query with word limit instruction
        return userText + `\n\nPlease keep your response under ${maxResponseWords} words and be concise.`;
      }
    } catch (error) {
      console.error('❌ RAG search error:', error);
      setStatusMessage('❌ RAG search failed');
      onError?.(error as Error);

      // Fallback to original query
      return userText + `\n\nPlease keep your response under ${maxResponseWords} words.`;
    }
  }, [numResults, maxResponseWords, onError]);

  /**
   * Handle final transcript
   */
  const handleFinalTranscript = useCallback(async (transcript: string) => {
    const trimmedTranscript = transcript.trim();

    if (trimmedTranscript.length < 3) {
      console.log('❌ Transcript too short:', trimmedTranscript);
      setStatusMessage('❌ Speech too short, try again');
      setCurrentTranscript('');
      return;
    }

    console.log('\n🎤 === USER SPOKE ===');
    console.log(`📝 Transcript: "${trimmedTranscript}"`);
    setCurrentTranscript(trimmedTranscript);
    setInterimTranscript('');

    try {
      // Process with RAG
      const enhancedPrompt = await processWithRAG(trimmedTranscript);

      // Send to Gemini as TEXT (not audio)
      setStatusMessage('🤖 Asking Gemini...');
      console.log('\n🤖 === SENDING TO GEMINI ===');
      console.log('📤 Sending enhanced prompt...');

      if (geminiClientRef.current && geminiClientRef.current.getIsConnected()) {
        await geminiClientRef.current.sendTextInput(enhancedPrompt);
        console.log('✅ Sent to Gemini, waiting for response...');
        setStatusMessage('⏳ Waiting for Gemini...');
      } else {
        throw new Error('Not connected to Gemini');
      }
    } catch (error) {
      console.error('❌ Error processing query:', error);
      setStatusMessage(`❌ Error: ${(error as Error).message}`);
      onError?.(error as Error);
    }
  }, [processWithRAG, onError]);

  /**
   * Start voice mode
   */
  const start = useCallback(async () => {
    try {
      console.log('\n🚀 === STARTING VOICE RAG MODE ===');
      setStatusMessage('🚀 Initializing...');

      // 1. Initialize RAG service
      console.log('\n1️⃣ Initializing RAG...');
      ragServiceRef.current = initializeRAG();

      if (ragServiceRef.current) {
        console.log('✅ RAG service ready');
      } else {
        console.log('⚠️ Running without RAG');
      }

      // 2. Initialize Gemini client
      console.log('\n2️⃣ Connecting to Gemini...');
      setStatusMessage('🔌 Connecting to Gemini...');

      const client = new GeminiLiveClient(apiKey, {
        onTranscript: (text, isFinal) => {
          console.log('🤖 Gemini transcript:', text, 'isFinal:', isFinal);
        },
        onAudio: async (audioData) => {
          console.log('🔊 Received audio from Gemini, playing...');
          if (playerRef.current) {
            setIsGeminiSpeaking(true);
            setStatusMessage('🔊 Gemini speaking...');

            await playerRef.current.playBase64Audio(audioData, () => {
              console.log('✅ Gemini finished speaking\n');
              setIsGeminiSpeaking(false);
              setStatusMessage('✅ Ready - speak now!');
            });
          }
        },
        onError: (error) => {
          console.error('❌ Gemini error:', error);
          setStatusMessage('❌ Gemini error');
          onError?.(error);
        },
        onConnected: () => {
          console.log('✅ Connected to Gemini Live API');
          setIsConnected(true);
          setStatusMessage('✅ Connected!');
        },
        onDisconnected: () => {
          console.log('🔌 Disconnected from Gemini');
          setIsConnected(false);
        }
      });

      await client.connect();
      geminiClientRef.current = client;
      console.log('✅ Gemini client ready');

      // 3. Initialize audio player
      console.log('\n3️⃣ Initializing audio player...');
      const player = new AudioPlayer();
      playerRef.current = player;
      console.log('✅ Audio player ready');

      // 4. Initialize speech recognition
      console.log('\n4️⃣ Initializing speech recognition...');
      setStatusMessage('🎤 Starting speech recognition...');

      const speechRecognition = new SpeechRecognitionService();

      if (!speechRecognition.isAvailable()) {
        throw new Error('❌ Speech recognition not supported. Please use Chrome or Edge browser.');
      }

      speechRecognitionRef.current = speechRecognition;

      // Start continuous speech recognition
      const stopFn = await speechRecognition.transcribeLive((text, isFinal) => {
        if (isFinal) {
          console.log('✅ Final transcript captured');
          setIsListening(false);
          handleFinalTranscript(text);
        } else {
          setIsListening(true);
          setInterimTranscript(text);
          setStatusMessage(`🎤 Listening: "${text.substring(0, 50)}..."`);
        }
      });

      stopRecognitionRef.current = stopFn;
      console.log('✅ Speech recognition started');

      setIsActive(true);
      setStatusMessage('✅ Ready - speak now!');

      console.log('\n✅ === VOICE RAG MODE ACTIVE ===');
      console.log('🎤 Start speaking into your microphone');
      console.log('💡 Speak clearly and wait for the response');
      console.log('🎧 Use headphones to prevent feedback\n');

    } catch (error) {
      console.error('\n❌ === FAILED TO START ===');
      console.error('Error:', error);
      setStatusMessage(`❌ Error: ${(error as Error).message}`);
      onError?.(error as Error);
      throw error;
    }
  }, [apiKey, initializeRAG, handleFinalTranscript, onError]);

  /**
   * Stop voice mode
   */
  const stop = useCallback(async () => {
    console.log('\n🛑 === STOPPING VOICE RAG MODE ===');
    setStatusMessage('🛑 Stopping...');

    // Stop speech recognition
    if (stopRecognitionRef.current) {
      console.log('🛑 Stopping speech recognition...');
      stopRecognitionRef.current();
      stopRecognitionRef.current = null;
    }

    // Stop player
    if (playerRef.current) {
      console.log('🛑 Stopping audio player...');
      playerRef.current.stop();
      playerRef.current.cleanup();
      playerRef.current = null;
    }

    // Disconnect Gemini
    if (geminiClientRef.current) {
      console.log('🛑 Disconnecting from Gemini...');
      await geminiClientRef.current.disconnect();
      geminiClientRef.current = null;
    }

    // Reset state
    setIsActive(false);
    setIsConnected(false);
    setIsListening(false);
    setIsGeminiSpeaking(false);
    setCurrentTranscript('');
    setInterimTranscript('');
    setStatusMessage('✅ Stopped');

    console.log('✅ === VOICE RAG MODE STOPPED ===\n');
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isActive) {
        console.log('🧹 Cleanup on unmount');
        stop();
      }
    };
  }, [isActive, stop]);

  return {
    // State
    isActive,
    isConnected,
    isListening,
    isGeminiSpeaking,
    currentTranscript,
    interimTranscript,
    conversationHistory,
    retrievedDocs,
    statusMessage,

    // Actions
    start,
    stop,

    // Computed
    isRAGEnabled: ragServiceRef.current !== null
  };
}
