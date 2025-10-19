# Architecture Documentation

## Overview

This application is a voice-powered code assistant that combines real-time voice interaction with semantic code search. It uses Gemini Flash 2.5 Live API for voice processing and Vectara RAG for intelligent code search.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Repo Manager │  │ Voice Mode   │  │ Chat Timeline│      │
│  │ Component    │  │ Component    │  │ Component    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         ├──────────────────┴──────────────────┤              │
│         │          State Management           │              │
│         │    (React Hooks & Context)          │              │
│         └──────────────────┬──────────────────┘              │
└────────────────────────────┼─────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Gemini     │    │   Backend    │    │   Vectara    │
│   Live API   │    │   API        │    │   RAG        │
│  (WebSocket) │    │  (REST)      │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow

### Voice Interaction Flow

1. **User speaks** → Microphone captures audio
2. **Audio chunks** → Sent to Gemini via WebSocket
3. **Live transcription** → Displayed word-by-word in UI
4. **Final transcript** → Triggers backend search
5. **Backend query** → POST to `/api/search` with query + repo
6. **Vectara RAG** → Searches code and generates answer
7. **Response** → Displayed in chat timeline
8. **TTS** → Answer sent back to Gemini for voice output
9. **Audio playback** → User hears the response

### Text Interaction Flow

1. **User types** → Text input component
2. **Submit** → POST to `/api/search` endpoint
3. **Backend processing** → Same as voice flow (steps 5-7)
4. **Display** → Show in chat timeline
5. **Optional TTS** → If voice mode is active

## Component Architecture

### Core Components

#### 1. RepoManagementPanel

- **Purpose**: Manage GitHub repositories
- **State**: List of repos, active repo, loading states
- **Features**: Add, switch, remove repositories
- **Integration**: None (self-contained)

#### 2. VoiceModeToggle

- **Purpose**: Control voice mode activation
- **State**: Voice state (idle/listening/thinking/speaking)
- **Features**: Animated button, state indicators, pulses
- **Integration**: useVoiceMode hook

#### 3. LiveTranscript

- **Purpose**: Show real-time speech transcription
- **State**: Current transcript text
- **Features**: Word-by-word animation, pulse effects
- **Integration**: Receives text from useVoiceMode

#### 4. ChatTimeline

- **Purpose**: Display conversation history
- **State**: Array of messages with metadata
- **Features**: User/AI bubbles, timestamps, sources
- **Integration**: useChat hook, SourcesView component

#### 5. SourcesView

- **Purpose**: Display code sources and snippets
- **State**: Array of source objects
- **Features**: File names, code snippets, GitHub links
- **Integration**: Embedded in ChatTimeline

#### 6. TextInputFallback

- **Purpose**: Alternative text-based input
- **State**: Input text, loading state
- **Features**: Text input, submit button, loading indicator
- **Integration**: useChat hook

### Custom Hooks

#### useVoiceMode

```typescript
const {
  voiceState, // Current voice state
  currentTranscript, // Live transcript text
  transcript, // Array of completed transcripts
  startVoiceMode, // Activate voice mode
  stopVoiceMode, // Deactivate voice mode
  setThinking, // Set thinking state
  resetToListening, // Return to listening
  sendTextForTTS, // Send text for speech output
  interruptSpeech, // Stop current playback
} = useVoiceMode(geminiWsUrl);
```

**Responsibilities:**

- WebSocket connection management
- Audio recording (AudioRecorder class)
- Audio playback (AudioPlayer class)
- Transcript state management
- Voice state transitions

#### useRepositories

```typescript
const {
  repositories, // Array of repositories
  activeRepo, // Currently selected repo
  isLoading, // Loading state
  addRepository, // Add new repository
  switchRepository, // Change active repo
  removeRepository, // Delete repository
} = useRepositories();
```

**Responsibilities:**

- Repository CRUD operations
- Active repository tracking
- Repository status management

#### useChat

```typescript
const {
  messages, // Conversation history
  isLoading, // API request state
  handleUserQuery, // Process user query
  addMessage, // Add message to history
  updateMessage, // Update existing message
  clearMessages, // Clear conversation
} = useChat();
```

**Responsibilities:**

- Message state management
- Backend API integration
- Loading state handling

### Utility Classes

#### AudioRecorder

```typescript
class AudioRecorder {
  async requestPermission(): Promise<boolean>;
  async start(onData: (data: ArrayBuffer) => void): Promise<void>;
  stop(): void;
  isRecording(): boolean;
}
```

#### AudioPlayer

```typescript
class AudioPlayer {
  async play(audioData: ArrayBuffer): Promise<void>;
  stop(): void;
  getIsPlaying(): boolean;
  cleanup(): void;
}
```

#### GeminiWebSocket

```typescript
class GeminiWebSocket {
  connect(handlers: WebSocketEventHandler): Promise<void>;
  sendAudio(audioData: ArrayBuffer): void;
  sendText(text: string, type: "query" | "tts"): void;
  sendControl(command: string): void;
  disconnect(): void;
  isConnected(): boolean;
}
```

## Integration Points

### 1. Gemini Flash 2.5 Live API

**Endpoint**: WebSocket connection
**Protocol**: Binary (audio) + JSON (control)

**Message Format**:

```typescript
// Outgoing (Frontend → Gemini)
{
  type: 'audio' | 'control' | 'tts',
  data?: ArrayBuffer | any,
  text?: string
}

// Incoming (Gemini → Frontend)
{
  type: 'transcript' | 'audio',
  text?: string,
  isFinal?: boolean,
  data?: ArrayBuffer // base64 encoded
}
```

**Setup Required**:

1. Obtain Gemini API credentials
2. Set up WebSocket server/proxy
3. Configure `NEXT_PUBLIC_GEMINI_WS_URL` in `.env.local`

### 2. Vectara RAG Backend

**Endpoint**: `/api/search` (Next.js API route)
**Method**: POST
**Content-Type**: application/json

**Request**:

```typescript
interface SearchRequest {
  query: string; // User's question
  repo: string; // Repository identifier
}
```

**Response**:

```typescript
interface SearchResponse {
  answer: string; // Generated answer
  sources: Array<{
    file: string; // File path
    snippet: string; // Code snippet
    repo?: string; // Repository name
    url?: string; // GitHub URL
  }>;
}
```

**Integration Steps**:

1. Set up Vectara account and corpus
2. Index repositories into Vectara
3. Implement backend API in `src/app/api/search/route.ts`
4. Add Vectara API credentials to environment

### 3. GitHub Integration

**Purpose**: Repository indexing and source links

**Required**:

- GitHub API token (for private repos)
- Repository webhooks (for auto-indexing)
- Backend service to fetch and index code

## State Management

### Global State

- **Repositories**: Managed by useRepositories hook
- **Messages**: Managed by useChat hook
- **Voice State**: Managed by useVoiceMode hook

### Local State

- Component-specific UI states
- Form inputs
- Modal visibility

### State Persistence

Currently, all state is in-memory. For persistence:

1. Add localStorage for repositories
2. Add session storage for messages
3. Implement user authentication for cross-device sync

## Security Considerations

### API Keys

- Never expose API keys in frontend code
- Use environment variables for configuration
- Implement backend proxy for sensitive operations

### WebSocket Security

- Use WSS (WebSocket Secure) in production
- Implement authentication/authorization
- Rate limiting on connections

### Data Privacy

- Audio data is streamed, not stored
- Implement proper CORS policies
- Add user consent for microphone access

## Performance Optimization

### Current Optimizations

- React.memo for expensive components
- useCallback for event handlers
- Lazy loading for heavy components
- Efficient WebSocket reconnection

### Future Improvements

- Virtual scrolling for long chat histories
- Audio chunk buffering
- Service worker for offline support
- CDN for static assets

## Testing Strategy

### Unit Tests

- Test custom hooks in isolation
- Test utility functions
- Test component logic

### Integration Tests

- Test component interactions
- Test API integrations
- Test WebSocket connections

### E2E Tests

- Test complete user flows
- Test voice interaction
- Test error scenarios

## Deployment

### Environment Variables

```env
# Required
NEXT_PUBLIC_GEMINI_WS_URL=wss://your-gemini-endpoint

# Optional
NEXT_PUBLIC_API_URL=https://your-backend-api
VECTARA_API_KEY=your-vectara-key (backend only)
GITHUB_TOKEN=your-github-token (backend only)
```

### Build Command

```bash
pnpm build
```

### Production Checklist

- [ ] Configure production WebSocket URL
- [ ] Set up backend API with Vectara
- [ ] Enable HTTPS/WSS
- [ ] Configure CORS policies
- [ ] Set up monitoring and logging
- [ ] Test microphone permissions
- [ ] Verify responsive design
- [ ] Run accessibility audit
- [ ] Performance testing

## Troubleshooting

### Common Issues

**1. Microphone not working**

- Check browser permissions
- Ensure HTTPS connection
- Verify audio constraints

**2. WebSocket connection fails**

- Verify URL is correct
- Check CORS settings
- Ensure backend is running

**3. No search results**

- Verify repository is indexed
- Check backend API logs
- Validate Vectara configuration

**4. Audio playback issues**

- Check audio format compatibility
- Verify codec support
- Test with different browsers

## Future Enhancements

1. **Multi-language Support**: Add i18n for global users
2. **Code Execution**: Inline code execution in sandbox
3. **Collaborative Features**: Share conversations with team
4. **Advanced RAG**: Context-aware follow-up questions
5. **Custom Models**: Support for custom voice models
6. **Mobile App**: Native iOS/Android applications
7. **IDE Integration**: VSCode extension
8. **Analytics Dashboard**: Usage metrics and insights
