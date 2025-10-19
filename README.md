# Voice Code Assistant

A sophisticated voice-powered code assistant built with Next.js (App Router), featuring real-time voice interaction powered by Gemini Flash 2.5 Live API and Vectara RAG for intelligent code search.

## Features

✨ **Voice-First Interaction**

- Real-time speech-to-text with live transcription
- Natural voice conversations with AI assistant
- Text-to-speech responses
- Interrupt capability for dynamic conversations

🎨 **Beautiful UI**

- Fluid animations powered by Framer Motion
- ChatGPT-like voice control experience
- Maya Blue (AI) and Slate Gray (User) color scheme
- Responsive design for mobile and desktop

🔍 **Intelligent Code Search**

- Integration with Vectara RAG for semantic code search
- Repository management with live status updates
- Source code snippets with each answer
- GitHub integration

🎯 **Professional Design**

- Built with Shadcn UI components
- Lucide icons throughout
- Tailwind CSS for styling
- Fully accessible with ARIA labels

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Voice**: Gemini Flash 2.5 Live API
- **Search**: Vectara RAG (backend integration)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/app/apikey))
- FastAPI backend running at `http://localhost:8000` (optional, for search functionality)

### Installation

1. **Clone the repository** (if you haven't already)

2. **Install dependencies**:

```bash
pnpm install
```

3. **Set up environment variables**:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Gemini API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/search
```

4. **Start the development server**:

```bash
pnpm dev
```

5. **Open the app**: Navigate to [http://localhost:3000](http://localhost:3000)

### Voice Mode Setup

The voice mode uses **Gemini Flash 2.5 Live API** with the following specifications:

- Model: `gemini-live-2.5-flash-preview`
- Input audio: 16kHz mono PCM, base64-encoded
- Output audio: 24kHz mono PCM, base64-encoded
- Real-time bidirectional streaming

**To use voice mode:**

1. Make sure `NEXT_PUBLIC_GEMINI_API_KEY` is set in `.env.local`
2. Click the large circular voice button (128px)
3. Grant microphone permissions when prompted
4. Start speaking - you'll see live transcription
5. The assistant will respond with voice

## Audio Configuration for Optimal Human Experience

### Voice Input Settings

The system is now optimized for natural human conversation patterns:

- **Silence Detection**: 3-second timeout (allows for natural pauses and thinking)
- **Minimum Speech Duration**: 0.5 seconds (prevents false triggers from background noise)
- **Sensitivity**: Lower threshold for better detection of quiet speech

### Voice Output Settings

Gemini's speech is automatically adjusted for natural hearing:

- **Default Playback Rate**: 0.9x (10% slower for better comprehension)
- **Sample Rate Conversion**: Proper 24kHz to 48kHz resampling preserves timing
- **Audio Quality**: High-quality linear interpolation for smooth playback

### Adjusting Audio Settings

You can customize the audio experience programmatically:

```typescript
// Adjust speech playback speed (0.7-1.1 recommended for speech)
setPlaybackSpeed(0.8); // 20% slower
setPlaybackSpeed(1.0); // Normal speed
setPlaybackSpeed(1.1); // 10% faster

// Values outside 0.5-2.0 are automatically clamped for safety
```

### Troubleshooting Audio Issues

**If input cuts off too quickly:**

- Check microphone levels in your OS settings
- Ensure you're in a quiet environment
- The system needs 0.5s of continuous speech before starting silence detection

**If output sounds too fast:**

- The system defaults to 0.9x speed for natural listening
- Use `setPlaybackSpeed()` to adjust (0.8 for slower, 1.1 for faster)

**If you see console messages:**

- `🎙️ Speech detected` - System started recording your input
- `🔇 Natural pause detected` - System detected end of your speech
- `🎵 PLAYBACK STARTED at 0.9x speed` - AI response is playing

### Backend Integration

The app expects a FastAPI backend at `http://localhost:8000/search` that accepts:

**Request:**

```json
{
  "query": "string",
  "limit": 5
}
```

**Response:**

```json
{
  "summary": "string",
  "sources": [
    {
      "title": "string",
      "content": "string",
      "url": "string"
    }
  ]
}
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
