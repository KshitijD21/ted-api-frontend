# Quick Start Guide: Voice RAG Chat

## 🚀 Get Started in 5 Minutes

### Step 1: Configure Vectara Credentials

Edit `.env` file and add your Vectara credentials:

```bash
# Already configured
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# 👉 Add your Vectara credentials here
NEXT_PUBLIC_VECTARA_CUSTOMER_ID=your_customer_id_here
NEXT_PUBLIC_VECTARA_CORPUS_ID=your_corpus_id_here
NEXT_PUBLIC_VECTARA_API_KEY=your_api_key_here
```

> **Where to find these?**
>
> 1. Log in to [Vectara Console](https://console.vectara.com/)
> 2. Go to your corpus
> 3. Click "API Access" to get Customer ID, Corpus ID, and API Key

### Step 2: Add Component to Your App

Create a new page or modify `src/app/page.tsx`:

```tsx
import VoiceRAGChat from "@/components/VoiceRAGChat";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <VoiceRAGChat />
    </main>
  );
}
```

### Step 3: Start Development Server

```bash
pnpm dev
```

### Step 4: Use the App

1. Open http://localhost:3000
2. Click **"Connect to Gemini"**
3. Click **"Start Recording"**
4. Speak your question (minimum 2 seconds)
5. Wait for response!

---

## 🎤 Usage Tips

### Speaking Guidelines

- **Minimum Duration**: Speak for at least 2 seconds
- **Natural Pauses**: System waits 1.5s of silence before processing
- **Clear Speech**: Speak clearly for better transcription
- **One Question**: Ask one question per recording

### What to Expect

1. **Recording Phase** (🎤): "Speak for 2+ seconds..."
2. **Processing Phase** (🔄): Audio is being processed
3. **Transcription Phase** (🎤): Converting speech to text
4. **Search Phase** (🔍): Searching knowledge base
5. **Thinking Phase** (🤖): Gemini is preparing response
6. **Playback Phase** (🔊): Playing audio response

---

## 🔧 Troubleshooting

### "Speech recognition not supported"

**Problem**: Browser doesn't support Web Speech API

**Solutions**:

- Use Chrome or Edge (best support)
- Alternative: Implement Google Cloud Speech-to-Text (code included)

### "Vectara not configured"

**Problem**: Environment variables not set

**Solutions**:

1. Check `.env` file has all three Vectara variables
2. Restart dev server: `pnpm dev`
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

### "Transcription too short"

**Problem**: Spoke for less than 2 seconds

**Solutions**:

- Speak for longer duration
- Check microphone permissions in browser
- Verify microphone is working in system settings

### No Response from Gemini

**Problem**: Connection or API issue

**Solutions**:

1. Check browser console for errors (F12)
2. Verify Gemini API key is valid
3. Check internet connection
4. Try disconnecting and reconnecting

### Audio Not Playing

**Problem**: Browser audio policy or speaker issue

**Solutions**:

1. Check browser audio settings
2. Verify speakers are working
3. Check browser console for audio errors
4. Try clicking on the page first (autoplay policy)

---

## 🎯 Example Questions

### General Knowledge (No RAG)

- "What is artificial intelligence?"
- "Explain quantum computing"
- "Tell me about climate change"

### With Your Knowledge Base

- "What does our documentation say about authentication?"
- "How do I configure the database connection?"
- "What are the API rate limits?"

The system will search your Vectara corpus and enhance responses with relevant context!

---

## 📊 Debug Mode

### Enable Verbose Logging

All logs are already enabled in the console (F12):

- 🔍 **Vectara**: Search queries and results
- 📝 **Transcription**: What was understood
- 📊 **Buffer**: Audio buffer status
- 📤 **Prompts**: Enhanced prompt sent to Gemini
- 🤖 **Gemini**: API interactions
- 🔊 **Audio**: Playback status

### Example Console Output

```
🎤 Recording... (speak for 2+ seconds)
📊 BUFFER STATUS: { samples: 32000, duration: '2.00s', minRequired: '2.0s' }
🔇 Silence detected - processing audio
📦 Audio blob size: 64088 bytes
📝 Transcribed: What is machine learning?
🔍 Searching Vectara for: What is machine learning?
✅ Found 3 relevant documents
📤 Enhanced prompt length: 542
✅ Text sent with turnComplete=true
🎵 AUDIO DATA FOUND: 24kHz PCM
🔊 Playing response...
```

---

## 🔒 Security Notes

### Environment Variables

- `.env` file should be in `.gitignore`
- Never commit API keys to git
- Use `.env.local` for production secrets

### Vectara API Keys

- Keep API keys secure
- Use read-only API keys when possible
- Rotate keys regularly

---

## 🚀 Next Steps

### Enhance Your Implementation

1. **Better Transcription**

   - Implement Google Cloud Speech-to-Text for better accuracy
   - Code is already in `speech-recognition.ts`

2. **Conversation History**

   - Store messages in React state
   - Display chat timeline
   - Export conversation

3. **Custom UI**

   - Modify `VoiceRAGChat.tsx` styling
   - Add your brand colors
   - Customize messages

4. **Advanced Features**
   - Add interruption handling
   - Implement streaming transcription
   - Show document sources
   - Add voice selection

---

## 📚 Files You Can Customize

| File                    | Purpose       | What to Change                    |
| ----------------------- | ------------- | --------------------------------- |
| `VoiceRAGChat.tsx`      | Main UI       | Styling, layout, messages         |
| `vectara-service.ts`    | RAG logic     | Search parameters, context format |
| `audio.ts`              | Recording     | Buffer size, silence timeout      |
| `speech-recognition.ts` | Transcription | API choice, language              |

---

## 💡 Pro Tips

1. **Test Your Corpus**: Make sure Vectara has indexed documents before testing
2. **Microphone Quality**: Better mic = better transcription
3. **Quiet Environment**: Reduce background noise
4. **Browser Choice**: Chrome/Edge have best Web Speech API support
5. **Network Speed**: Faster internet = quicker responses

---

## 📖 Documentation

- [Full Implementation Guide](./VOICE_RAG_IMPLEMENTATION.md)
- [Architecture Comparison](./ARCHITECTURE_COMPARISON.md)
- [Gemini Live API Docs](https://ai.google.dev/gemini-api/docs/live)
- [Vectara Documentation](https://docs.vectara.com/)

---

**Ready to go?** Just add your Vectara credentials and start chatting! 🎉
