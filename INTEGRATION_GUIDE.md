# 🚀 Vectara RAG Integration Guide

## ✅ Setup Complete!

Your Vectara RAG system is now fully integrated and ready to use!

## 📦 What Was Created

### 1. **Core Service**

- `src/lib/vectara-service.ts` - Vectara API integration

### 2. **React Hooks**

- `src/hooks/useVectaraRAG.ts` - RAG enhancement hook
- `src/hooks/useVoiceModeWithRAG.ts` - Voice mode with RAG
- `src/hooks/useChat.ts` - **✅ ALREADY INTEGRATED**

### 3. **Components**

- `src/components/VoiceRAGChat.tsx` - Standalone voice RAG component
- `src/app/test-vectara/page.tsx` - Test interface

## 🎯 Integration Options

### Option 1: Use Enhanced `useChat` Hook (✅ Already Done!)

Your existing `useChat` hook is **already integrated** with Vectara! It now automatically:

1. Takes user query
2. Searches Vectara for context
3. Enhances the query with retrieved documents
4. Sends enhanced query to your backend

**No code changes needed** - just use it as before:

```tsx
const { handleUserQuery } = useChat();
await handleUserQuery("What is machine learning?");
// This now automatically uses Vectara RAG! ✨
```

### Option 2: Use Enhanced Voice Mode

Replace `useVoiceMode` with `useVoiceModeWithRAG` in your `src/app/page.tsx`:

```tsx
// ❌ OLD
import { useVoiceMode } from "@/hooks/useVoiceMode";
const { voiceState, startVoiceMode, ... } = useVoiceMode();

// ✅ NEW
import { useVoiceModeWithRAG } from "@/hooks/useVoiceModeWithRAG";
const {
  voiceState,
  startVoiceMode,
  ragEnabled,
  setRAGEnabled,
  ...
} = useVoiceModeWithRAG();
```

Benefits:

- Automatically enhances voice queries with Vectara
- Shows toast notifications when RAG is used
- Toggle RAG on/off with `setRAGEnabled()`

### Option 3: Manual Integration

Use the `useVectaraRAG` hook directly:

```tsx
import { useVectaraRAG } from "@/hooks/useVectaraRAG";

const { enhanceQueryWithRAG } = useVectaraRAG();

async function handleQuery(userInput: string) {
  const enhanced = await enhanceQueryWithRAG(userInput);

  if (enhanced.hasContext) {
    console.log("Using RAG context!");
    console.log(`Found ${enhanced.retrievedDocs.length} documents`);
  }

  // Use enhanced.enhancedPrompt instead of userInput
  await sendToBackend(enhanced.enhancedPrompt);
}
```

## 🔥 Quick Start

### Test Vectara Connection

```bash
# Dev server should be running
pnpm dev

# Open test page
open http://localhost:3000/test-vectara
```

### Use in Your Existing App

Your main page at `src/app/page.tsx` **already has RAG enabled** through `useChat`!

Just use your app normally:

1. Type or speak a question
2. **✨ RAG automatically enhances it with Vectara context**
3. Get improved responses!

## 📊 How to Verify It's Working

### Check Console Logs

When you ask a question, you should see:

```
🚀 [useChat] Processing query: What is machine learning?
🔍 [useVectaraRAG] Enhancing query with RAG: What is machine learning?
🔍 [useVectaraRAG] Searching Vectara...
✅ [useVectaraRAG] Found 3 relevant documents
📄 [useVectaraRAG] Top result: { score: 0.857, text: "..." }
✨ [useVectaraRAG] Enhanced prompt created
📏 [useVectaraRAG] Prompt length: 542
📤 [useChat] Sending to backend: Based on the following information...
```

### Check UI

When RAG is used, you'll see a toast notification:

```
✅ Using 3 knowledge base documents
Enhanced with relevant context
```

## 🎛️ Configuration

### Enable/Disable RAG

Edit `src/hooks/useChat.ts`:

```typescript
const { enhanceQueryWithRAG } = useVectaraRAG({
  enabled: true, // Set to false to disable RAG
  numResults: 3, // Number of documents to retrieve
  maxResponseWords: 100, // Max words in AI response
});
```

### Adjust Search Parameters

In `vectara-service.ts`, you can modify:

- Number of results: `search(query, 5)` instead of 3
- Prompt template: `buildContextPrompt()` method
- Response word limit

## 🐛 Troubleshooting

### RAG Not Being Used?

**Check Console:**

1. Open DevTools (F12)
2. Look for `[useVectaraRAG]` logs
3. If missing, RAG hook not called

**Check Environment:**

```bash
# Verify .env has all 3 variables
cat .env | grep VECTARA
```

### No Documents Found?

1. **Test Vectara**: http://localhost:3000/test-vectara
2. **Check Corpus**: Does it have indexed documents?
3. **Try Different Query**: Use query related to your corpus content

### Backend Getting Wrong Query?

**Option A:** Backend needs plain query, not enhanced

- Remove RAG from `useChat`
- Use RAG only in voice mode

**Option B:** Backend expects enhanced query

- Keep current setup ✅
- Backend will receive context-rich prompts

## 🎨 UI Enhancements

### Show Retrieved Sources

Add to your chat component:

```tsx
function ChatMessage({ message }) {
  return (
    <div>
      <p>{message.content}</p>

      {/* Show RAG sources if available */}
      {message.ragSources && (
        <div className="text-sm text-gray-500 mt-2">
          <p>📚 Sources from knowledge base:</p>
          <ul>
            {message.ragSources.map((source, i) => (
              <li key={i}>
                Score: {source.score.toFixed(3)} -{" "}
                {source.text.substring(0, 50)}...
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Add RAG Toggle

```tsx
function App() {
  const [ragEnabled, setRagEnabled] = useState(true);

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={ragEnabled}
          onChange={(e) => setRagEnabled(e.target.checked)}
        />
        Enable Knowledge Base (RAG)
      </label>
    </div>
  );
}
```

## 📈 Performance

### Expected Latency

- **Vectara Search**: ~200-500ms
- **Gemini Response**: ~1-2s
- **Total**: ~1.5-2.5s (vs ~1s without RAG)

### Optimization Tips

1. **Cache Results**: Store recent searches
2. **Reduce Documents**: Use `numResults: 2` instead of 3
3. **Parallel Requests**: Search Vectara while transcribing

## 🎯 Next Steps

### 1. Test Your Integration

```bash
# Start dev server
pnpm dev

# Test Vectara
open http://localhost:3000/test-vectara

# Use your main app
open http://localhost:3000
```

### 2. Monitor Console Logs

Watch for `[useVectaraRAG]` logs to confirm RAG is working

### 3. Try Example Questions

- "What is [topic in your corpus]?"
- "Tell me about [specific document]"
- "How does [feature] work?"

### 4. Adjust as Needed

- Change number of results
- Modify prompt template
- Add/remove sources in UI

## 🎉 You're All Set!

Your app now has **end-to-end Vectara RAG integration**:

✅ Voice input with transcription
✅ Automatic Vectara search
✅ Context-enhanced prompts
✅ Improved AI responses
✅ Full logging and debugging

**Try it now**: Ask a question and watch the magic happen! ✨

---

## 📞 Need Help?

1. **Check Logs**: DevTools Console (F12)
2. **Test Vectara**: http://localhost:3000/test-vectara
3. **Review Config**: Check `.env` file
4. **Read Docs**: See `VECTARA_TESTING.md`
