# Voice-to-Voice RAG Chat - Complete Implementation

This implementation brings the Python `AudioLoopWithRAG` functionality to your Next.js application with TypeScript.

## 🎯 What's Implemented

This is a **complete port** of your Python voice-to-voice RAG system. Here's the mapping:

### Python → TypeScript Mapping

| Python Component             | TypeScript Component               | Location                                              |
| ---------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `AudioLoopWithRAG` class     | `useVoiceModeWithRAGEnhanced` hook | `/src/hooks/useVoiceModeWithRAGEnhanced.ts`           |
| `speech_recognition`         | Web Speech API wrapper             | Integrated in hook + `/src/lib/speech-recognition.ts` |
| `VectaraRAGService`          | `VectaraRAGService`                | `/src/lib/vectara-service.ts`                         |
| `pyaudio` + audio processing | `AudioRecorder` + `AudioPlayer`    | `/src/lib/audio.ts`                                   |
| Gemini Live API              | `GeminiLiveClient`                 | `/src/lib/gemini-client.ts`                           |
| UI (if any)                  | `VoiceRAGChatEnhanced`             | `/src/components/VoiceRAGChatEnhanced.tsx`            |

## 🔄 Complete Flow Implementation

### 1. **User Speaks → Microphone Capture**

```typescript
// Python: pyaudio captures at 16kHz
// TypeScript: AudioRecorder captures and resamples to 16kHz
const recorder = new AudioRecorder();
await recorder.start(handleAudioChunk, handleSilence);
```

### 2. **Silence Detection → Auto-Processing**

```typescript
// Python: 1.5s silence threshold, 2s minimum speech
// TypeScript: Exact same thresholds
const SILENCE_THRESHOLD = 1.5; // seconds
const MIN_AUDIO_LENGTH = 2.0; // seconds
```

### 3. **Speech-to-Text Transcription**

```typescript
// Python: speech_recognition.recognize_google()
// TypeScript: Web Speech API (continuous recognition)
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.start();
```

### 4. **RAG Search → Context Retrieval**

```typescript
// Python: rag_service.search(query, num_results=3)
// TypeScript: Exact same
const docs = await ragService.search(userText, 3);
```

### 5. **Enhanced Prompt Building**

```typescript
// Python: rag_service.build_context_prompt(query, docs, max_words)
// TypeScript: Exact same
const enhancedPrompt = ragService.buildContextPrompt(
  userText,
  docs,
  100 // max words
);
```

### 6. **Send to Gemini as Text**

```typescript
// Python: session.send(input=enhanced_prompt, end_of_turn=True)
// TypeScript: Exact same
await geminiClient.sendTextInput(enhancedPrompt);
```

### 7. **Receive Audio Response**

```typescript
// Python: Receives 24kHz PCM audio
// TypeScript: Exact same
onAudio: async (audioData) => {
  await player.playBase64Audio(audioData);
};
```

### 8. **Play Through Speakers**

```typescript
// Python: pyaudio plays at 24kHz
// TypeScript: AudioPlayer plays at browser's sample rate (resampled)
const player = new AudioPlayer();
await player.playBase64Audio(audioData);
```

### 9. **Interruption Detection**

```typescript
// Python: Checks audio level while Gemini speaks
// TypeScript: Exact same logic
const detectInterruption = (audioData: string): boolean => {
  if (!isGeminiSpeaking) return false;
  if (audioLevel > INTERRUPTION_THRESHOLD) {
    console.log("🛑 Interruption detected!");
    player.stop();
    return true;
  }
  return false;
};
```

### 10. **Conversation History**

```typescript
// Python: Stores conversation_history list
// TypeScript: Exact same
interface ConversationEntry {
  user: string;
  contextDocs: VectaraSearchResult[];
  enhancedPrompt: string;
  timestamp: Date;
}
```

## 🚀 How to Use

### 1. Setup Environment Variables

Create `.env.local`:

```bash
# Gemini API (from Google AI Studio or Vertex AI)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Vectara RAG
NEXT_PUBLIC_VECTARA_CUSTOMER_ID=your_customer_id
NEXT_PUBLIC_VECTARA_CORPUS_ID=your_corpus_id
NEXT_PUBLIC_VECTARA_API_KEY=your_vectara_api_key
```

### 2. Navigate to the Page

```bash
# Start dev server
pnpm dev

# Open in browser
http://localhost:3000/voice-rag-enhanced
```

### 3. Grant Permissions

- **Microphone**: Browser will ask for microphone access
- **Auto-play**: Some browsers may block audio playback initially

### 4. Start Chatting

1. Click the **microphone button** to start
2. **Speak your question** (minimum 2 seconds)
3. **Stop speaking** for 1.5 seconds → auto-processes
4. Watch the flow:
   - 🎤 **Transcription** appears
   - 🔍 **RAG search** finds relevant docs
   - 📚 **Retrieved sources** shown
   - 🤖 **Gemini responds** with audio
   - 💬 **Conversation history** updates

### 5. Advanced Features

**Interruption Support:**

- Gemini is speaking? Just **start talking** to interrupt!
- System detects your voice and stops Gemini's audio

**Real-time Feedback:**

- **Audio level indicator** shows your voice volume
- **Status badges** show current state (Recording, Gemini Speaking, etc.)
- **Retrieved sources** displayed with relevance scores

## 📊 Configuration Options

### Adjust Response Length

```typescript
const {
  ...
} = useVoiceModeWithRAGEnhanced({
  apiKey,
  ragEnabled: true,
  numResults: 3,        // Number of Vectara docs to retrieve
  maxResponseWords: 100 // Max words in Gemini's response
});
```

### Adjust Detection Thresholds

Edit `/src/hooks/useVoiceModeWithRAGEnhanced.ts`:

```typescript
const SILENCE_THRESHOLD = 1.5; // seconds of silence to process
const MIN_AUDIO_LENGTH = 2.0; // minimum speech duration
const INTERRUPTION_THRESHOLD = 200; // RMS level for interruption
const AUDIO_DETECTION_THRESHOLD = 100; // RMS level for speech start
```

## 🎨 UI Components

### Main Component: `VoiceRAGChatEnhanced`

Features:

- **Large microphone button** - Start/Stop voice mode
- **Audio level visualizer** - Real-time bar showing volume
- **Status indicators** - Recording, Gemini Speaking, Listening
- **Transcript display** - Shows what you said
- **Retrieved documents** - Shows RAG context with scores
- **Conversation history** - Full chat history with timestamps
- **Instructions panel** - How to use guide
- **Configuration status** - Shows what's enabled

### Customize UI

The component uses **shadcn/ui** components:

- `Card` - For panels
- `Badge` - For status indicators
- `Button` - For controls

Colors match your dark theme with purple/pink gradients.

## 🔧 Technical Details

### Audio Processing

**Recording:**

- Captures at **browser's native sample rate** (usually 48kHz)
- Resamples to **16kHz mono PCM** for Gemini
- Uses **RMS calculation** for volume detection
- **Normalizes audio** to prevent clipping

**Playback:**

- Receives **24kHz PCM** from Gemini
- Resamples to **browser's native rate**
- Uses **Web Audio API** for playback
- Applies **0.9x playback rate** for clarity

### Speech Recognition

**Web Speech API:**

- **Continuous mode** - Always listening
- **Interim results** - Shows live transcription
- **Auto-restart** - Recovers from errors
- **Language**: English (US)

**Limitations:**

- Chrome/Edge: ✅ Full support
- Firefox: ⚠️ Limited support
- Safari: ✅ Supported

### RAG Integration

**Exact Python behavior:**

```python
# Python
retrieved_docs = rag_service.search(user_text, num_results=3)
enhanced_prompt = rag_service.build_context_prompt(user_text, retrieved_docs, 100)
```

```typescript
// TypeScript - Same API
const docs = await ragService.search(userText, 3);
const enhancedPrompt = ragService.buildContextPrompt(userText, docs, 100);
```

### Gemini Live API

**Text + Audio Mixed Mode:**

- Sends **text** (enhanced prompt) to Gemini
- Receives **audio** response (24kHz PCM)
- Supports **interruption** via audio player stop

## 🐛 Troubleshooting

### "No transcription result"

- **Cause**: Web Speech API timeout or no speech detected
- **Fix**: Speak louder and more clearly
- **Note**: Ensure mic permissions granted

### "RAG disabled - check credentials"

- **Cause**: Vectara env variables not set
- **Fix**: Add to `.env.local` and restart dev server

### Audio feedback/echo

- **Cause**: Speakers picked up by microphone
- **Fix**: **Use headphones** (recommended)

### No Gemini response

- **Cause**: API key invalid or rate limit
- **Fix**: Check API key in browser console logs

### Browser compatibility

- **Best**: Chrome/Edge (full Web Speech API support)
- **Good**: Safari (works but may have quirks)
- **Limited**: Firefox (basic support)

## 📝 Differences from Python

### 1. Transcription Method

**Python**: Uses Google Speech Recognition API (cloud-based)
**TypeScript**: Uses Web Speech API (browser-based)

Both achieve the same result but TypeScript version is:

- ✅ **Free** (no API calls)
- ✅ **Lower latency** (local processing)
- ⚠️ **Browser-dependent** (needs Chrome/Edge for best results)

### 2. Audio Resampling

**Python**: Uses system sample rates directly
**TypeScript**: Browser handles resampling automatically

### 3. Error Handling

**Python**: Try-except blocks
**TypeScript**: async/await with try-catch + callbacks

## 🎯 Next Steps

### Enhance Transcription (Optional)

If you need better transcription accuracy, add Google Cloud Speech-to-Text:

```typescript
// In speech-recognition.ts - already implemented!
const transcript = await speechService.transcribeWithGoogle(
  audioBlob,
  "YOUR_GOOGLE_CLOUD_API_KEY"
);
```

### Add More RAG Features

- **Document filtering** by metadata
- **Hybrid search** (semantic + keyword)
- **Multi-turn context** preservation

### Custom UI Themes

Edit `/src/components/VoiceRAGChatEnhanced.tsx` to match your brand:

```typescript
// Change gradient colors
className = "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900";
```

## 📚 Code Structure

```
src/
├── hooks/
│   └── useVoiceModeWithRAGEnhanced.ts  ← Main logic (AudioLoopWithRAG port)
├── lib/
│   ├── audio.ts                         ← Audio capture/playback
│   ├── gemini-client.ts                 ← Gemini Live API
│   ├── vectara-service.ts               ← RAG service
│   └── speech-recognition.ts            ← Transcription
├── components/
│   └── VoiceRAGChatEnhanced.tsx         ← UI component
└── app/
    └── voice-rag-enhanced/
        └── page.tsx                     ← Route
```

## ✅ What Works Like Python

- ✅ Real-time voice capture at 16kHz
- ✅ Automatic silence detection (1.5s)
- ✅ Minimum speech duration (2s)
- ✅ Speech-to-text transcription
- ✅ Vectara RAG search
- ✅ Context-enhanced prompt building
- ✅ Text → Gemini → Audio response
- ✅ 24kHz audio playback
- ✅ Interruption detection
- ✅ Conversation history
- ✅ Audio level monitoring
- ✅ Status indicators

## 🎉 You're Done!

Your Python voice RAG system is now fully implemented in TypeScript/React!

**Test it:**

```bash
pnpm dev
# Visit: http://localhost:3000/voice-rag-enhanced
```

**Say**: "Tell me about [topic in your knowledge base]"
**Watch**: The magic happen! 🎙️✨
