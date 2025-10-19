# Gemini Live API - Troubleshooting & Testing Guide

## ✅ Fixed Issues

### Issue: WebSocket Connection But No Response

**Problem**: The WebSocket connection was being established (101 Switching Protocols), but the SDK callbacks weren't configured correctly.

**Solution**: Updated `gemini-client.ts` to:

1. Pass callbacks directly to `ai.live.connect()` method (required by SDK v1.25.0)
2. Use event handlers: `onopen`, `onmessage`, `onerror`, `onclose`
3. Changed model from `gemini-live-2.5-flash-preview` to `gemini-2.0-flash-exp` (latest available)

---

## 🧪 How to Test

### 1. **Set Up Environment**

Make sure you have your Gemini API key in `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/search
```

### 2. **Start the Dev Server**

```bash
pnpm dev
```

### 3. **Open Browser Console**

Open [http://localhost:3000](http://localhost:3000) and open DevTools Console (F12).

### 4. **Click the Voice Button**

Click the large circular voice button. You should see:

```
Connecting to Gemini Live API...
WebSocket connection opened
Gemini Live API connected successfully
```

### 5. **Start Speaking**

Speak into your microphone. You should see:

```
Received message: { serverContent: { ... } }
```

And the transcript should appear on screen!

---

## 🔍 Debug Checklist

If voice mode isn't working, check these in order:

### ✅ API Key

```javascript
// In console:
localStorage.clear(); // Clear any cached data
console.log(process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 10)); // Should show "AIzaSyACXw"
```

### ✅ Microphone Permissions

- Browser should prompt for microphone access
- Check browser settings (chrome://settings/content/microphone)
- Try refreshing the page

### ✅ WebSocket Connection

Open Network tab → Filter by `WS` → Should see:

- URL: `wss://generativelanguage.googleapis.com/ws/...`
- Status: 101 Switching Protocols
- Messages tab should show incoming/outgoing frames

### ✅ Audio Recording

```javascript
// In console after clicking voice button:
navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    console.log("Microphone working!", stream.getTracks());
    stream.getTracks().forEach((track) => track.stop());
  })
  .catch((err) => console.error("Mic error:", err));
```

### ✅ Console Logs

You should see these logs when working correctly:

```
1. "Connecting to Gemini Live API..."
2. "WebSocket connection opened"
3. "Gemini Live API connected successfully"
4. "Recording started..."
5. "Received message: ..." (when you speak)
```

---

## 🐛 Common Errors & Fixes

### Error: "Gemini API key not configured"

**Fix**: Add `NEXT_PUBLIC_GEMINI_API_KEY` to `.env.local` and restart dev server

### Error: "NotAllowedError: Permission denied"

**Fix**: Grant microphone permissions in browser settings

### Error: "WebSocket connection failed"

**Fix**:

- Check API key is valid
- Check internet connection
- Try a different browser (Chrome recommended)

### Error: "Model not found"

**Fix**: The model name changed - we're now using `gemini-2.0-flash-exp` (already updated in code)

### No transcript appearing

**Fix**:

- Speak louder/closer to microphone
- Check console for message logs
- Verify `onTranscript` callback is being called

---

## 📊 Expected Flow

```
1. Click button → Request mic permission
                ↓
2. Connect to Gemini Live API (WebSocket)
                ↓
3. Start recording at 16kHz PCM
                ↓
4. Stream audio chunks (base64) to Gemini
                ↓
5. Receive transcript messages (live + final)
                ↓
6. Display transcript on screen
                ↓
7. On final transcript → Send to backend
                ↓
8. Backend returns summary → Send to Gemini for TTS
                ↓
9. Receive audio response → Play it
                ↓
10. Return to listening state
```

---

## 🔧 Updated Configuration

**Model**: `gemini-2.0-flash-exp` (was `gemini-live-2.5-flash-preview`)
**Response Modality**: `Modality.AUDIO`
**Callbacks**: Passed directly to `ai.live.connect()`
**Events**: `onopen`, `onmessage`, `onerror`, `onclose`

---

## 📝 Next Steps

1. ✅ Build successful
2. ⏳ Test voice button click
3. ⏳ Verify WebSocket connection
4. ⏳ Test microphone recording
5. ⏳ Verify transcript display
6. ⏳ Test full flow (speak → search → TTS)

---

## 🚀 Ready to Test!

The application is now built and ready. Start the dev server and try clicking the voice button!

```bash
pnpm dev
# Then open http://localhost:3000 and click the voice button
```
