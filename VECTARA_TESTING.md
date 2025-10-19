# 🧪 Vectara Testing Guide

## Quick Test

### Option 1: Browser Test (Recommended)

1. Start dev server: `pnpm dev`
2. Open: http://localhost:3000/test-vectara
3. Click "Test with VectaraRAGService" or "Test Direct API Call"
4. Check results and console logs (F12)

### Option 2: Node Script Test

```bash
npx tsx test-vectara.ts
```

## What to Check

### ✅ Success Indicators

- Connection status shows: "✅ SUCCESS! Found X results"
- Results are displayed with scores and text
- Browser console shows detailed API logs
- Enhanced prompt is shown with context

### ❌ Failure Indicators

- "Vectara credentials not configured"

  - **Fix**: Check `.env` file has all 3 variables
  - **Fix**: Restart dev server after editing `.env`

- "Connected but no results found"

  - **Issue**: Corpus is empty or no matching documents
  - **Fix**: Add documents to your Vectara corpus

- "API returned 401"

  - **Issue**: Invalid API key
  - **Fix**: Check API key in Vectara console

- "API returned 404"
  - **Issue**: Invalid customer ID or corpus ID
  - **Fix**: Verify IDs in Vectara console

## Current Configuration

```env
NEXT_PUBLIC_VECTARA_CUSTOMER_ID=242722897
NEXT_PUBLIC_VECTARA_CORPUS_ID=4
NEXT_PUBLIC_VECTARA_API_KEY=zwt_DneoUYT5gi2dtXegYR9QEWkS4WJ3jEcHd5UnqQ
```

## Debug Checklist

1. **Environment Variables**

   - [ ] All 3 Vectara variables are set
   - [ ] No typos in variable names
   - [ ] Dev server restarted after changes

2. **Vectara Corpus**

   - [ ] Corpus ID is correct
   - [ ] Corpus has documents indexed
   - [ ] Documents are published/enabled

3. **API Access**

   - [ ] API key is valid and not expired
   - [ ] API key has read permissions
   - [ ] No network/firewall blocking requests

4. **Browser Console**
   - [ ] Open DevTools (F12)
   - [ ] Check Console tab for detailed logs
   - [ ] Look for red error messages
   - [ ] Check Network tab for API calls

## Expected Output

### Successful Search

```
🔍 Searching Vectara for: What is machine learning?
📋 Configuration: { customerID: "242722897", corpusID: "4", ... }
📤 Sending payload: { query: [...] }
📥 Response status: 200
📊 Raw API response: { responseSet: [...] }
✅ Found 3 relevant documents
📄 First result preview: { text: "Machine learning is...", score: 0.857 }
```

### Failed Search (Empty Corpus)

```
🔍 Searching Vectara for: What is machine learning?
📥 Response status: 200
📊 Raw API response: { responseSet: [{ response: [] }] }
⚠️ No results returned. Corpus might be empty or query has no matches.
```

## Next Steps After Testing

1. **If Test Succeeds** ✅

   - Your Vectara connection is working!
   - Go to http://localhost:3000/voice-rag
   - Test the voice RAG chat
   - Check browser console to see if search is being called

2. **If Test Fails** ❌
   - Review error messages in console
   - Verify credentials in Vectara console
   - Check if corpus has documents
   - Try the troubleshooting steps above

## Common Issues

### Issue: No results in Voice RAG Chat

**Possible Causes:**

1. Vectara search not being called at all
2. Search results empty (corpus issue)
3. Results not being used in prompt

**Debug Steps:**

1. Check browser console during voice recording
2. Look for "🔍 Searching Vectara for:" log
3. Check if "✅ Found X documents" appears
4. Verify enhanced prompt includes "Based on the following information:"

### Issue: Gemini gives generic answers

**Cause:** Vectara context not being included in prompt

**Check:**

1. Search results were found
2. `buildContextPrompt()` is being called
3. Enhanced prompt is sent to Gemini (not original query)
4. Look for "📤 Enhanced prompt length:" in console

## Test Queries

Try these queries to test different scenarios:

```
"What is machine learning?"
"Tell me about AI"
"Explain neural networks"
"How does deep learning work?"
```

If your corpus has specific content, use queries related to that content.

---

**Ready to test?**
👉 Open http://localhost:3000/test-vectara and click the test button!
