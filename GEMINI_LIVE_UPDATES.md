# Gemini Live API Updates

## Summary of Changes

This document outlines the updates made to properly integrate with the Gemini Live API using best practices.

## Key Changes

### 1. **Updated Model to `gemini-live-2.5-flash-preview`**

- **Previous**: `gemini-2.0-flash-exp` ❌
- **Updated**: `gemini-live-2.5-flash-preview` ✅

**Why?** The half-cascade model (`gemini-live-2.5-flash-preview`) is optimized for workflows involving:

- Voice-to-text transcription
- Text-to-speech synthesis
- Backend processing between user input and model output

**Alternative**: For pure native audio processing without intermediate steps, you can use `gemini-2.5-flash-native-audio-preview-09-2025`

### 2. **Enabled Input Audio Transcription**

```typescript
config: {
  responseModalities: [Modality.AUDIO],
  inputAudioTranscription: { enabled: true }, // ✅ Added
}
```

This enables real-time transcription of user speech, allowing you to receive both interim and final transcripts.

### 3. **Fixed Message Handling for Transcription**

- **Previous**: Incorrectly listened for transcription in `modelTurn.parts`
- **Updated**: Now properly listens for `inputTranscription` events

```typescript
// Correct way to handle live transcription
if (content.inputTranscription) {
  const transcript = content.inputTranscription;
  this.callbacks.onTranscript(
    transcript.text || "",
    transcript.isFinal || false
  );
}
```

### 4. **Using Official SDK Best Practices**

The code now fully leverages the `@google/genai` SDK:

- No manual WebSocket URL construction
- No protocol version management (v1beta vs v1alpha)
- SDK handles session management automatically
- Clean callback-based API

## File Changes

### `src/lib/gemini-client.ts`

- ✅ Updated model to `gemini-live-2.5-flash-preview`
- ✅ Added `inputAudioTranscription: { enabled: true }` configuration
- ✅ Fixed `handleMessage()` to properly handle `inputTranscription` events
- ✅ Added comprehensive documentation comments
- ✅ Cleaned up ESLint warnings

## How It Works Now

### Connection Flow

```typescript
const ai = new GoogleGenAI({ apiKey });

const session = await ai.live.connect({
  model: "gemini-live-2.5-flash-preview",
  config: {
    responseModalities: [Modality.AUDIO],
    inputAudioTranscription: { enabled: true },
  },
  callbacks: {
    onopen: () => {
      /* Connected */
    },
    onmessage: (message) => {
      /* Handle message */
    },
    onerror: (error) => {
      /* Handle error */
    },
    onclose: () => {
      /* Disconnected */
    },
  },
});
```

### Message Handling

```typescript
// User speech transcription (real-time)
if (message.serverContent?.inputTranscription) {
  const { text, isFinal } = message.serverContent.inputTranscription;
  // text: transcribed text
  // isFinal: true when the transcription is complete
}

// Model audio response (TTS)
if (message.serverContent?.modelTurn?.parts) {
  for (const part of parts) {
    if (part.inlineData?.mimeType?.includes("audio")) {
      // Handle audio data (base64)
      const audioData = part.inlineData.data;
    }
  }
}
```

## Benefits

1. **Real-time Transcription**: Receive both interim and final transcripts of user speech
2. **Better Model**: Using the recommended model for voice workflows
3. **SDK-Managed Connection**: No manual WebSocket URL construction or protocol management
4. **Type Safety**: Better TypeScript support through the official SDK
5. **Future-Proof**: Automatically benefits from SDK updates and improvements

## Testing

Build verification completed successfully:

```bash
pnpm run build
✓ Compiled successfully
✓ Linting and checking validity of types
```

## References

- [Gemini Live API Documentation](https://ai.google.dev/gemini-api/docs/live)
- [@google/genai SDK](https://www.npmjs.com/package/@google/genai)
- [Model Information](https://ai.google.dev/gemini-api/docs/models/gemini)

## Next Steps

To test the changes:

1. Start the development server: `pnpm run dev`
2. Test voice input to verify transcription works
3. Check that audio responses play correctly
4. Monitor console logs for message structure

---

**Note**: The `websocket.ts` file remains in the codebase but is now superseded by the SDK-based approach in `gemini-client.ts`. Consider removing it if no longer needed.
