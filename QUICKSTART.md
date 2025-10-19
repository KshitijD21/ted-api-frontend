# Quick Start Guide

Get your Voice Code Assistant running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A GitHub repository to search
- Access to Gemini Flash 2.5 Live API (or mock endpoint)

## Step 1: Installation

```bash
# Clone the repository
cd ted-api-frontend

# Install dependencies
pnpm install
```

## Step 2: Environment Setup

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_GEMINI_WS_URL=ws://localhost:8080/gemini
```

> **Note**: For development, you can use a mock WebSocket server or skip voice features initially.

## Step 3: Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Add a Repository

1. In the top input field, enter a GitHub repository URL:

   ```
   https://github.com/vercel/next.js
   ```

2. Click the "+" button

3. Wait for "Indexing..." to change to "Active"

## Step 5: Try Voice Mode (Optional)

If you have Gemini WebSocket configured:

1. Click the large microphone button
2. Allow microphone permissions
3. Speak your question naturally
4. Watch the live transcript appear
5. Receive AI response with sources

## Step 6: Try Text Mode

1. Click "Type Instead" in the header
2. Type a question about your repository:
   ```
   How does routing work in this framework?
   ```
3. Press Enter or click Send
4. View the response with sources

## Development Workflow

### Running Tests

```bash
pnpm test
```

### Type Checking

```bash
pnpm tsc --noEmit
```

### Linting

```bash
pnpm lint
```

### Building for Production

```bash
pnpm build
pnpm start
```

## Backend Integration

The app needs a backend API for code search. You have two options:

### Option A: Mock API (Quick Test)

The included `/api/search` route returns mock data. You can test the UI without a real backend.

### Option B: Real Backend (Recommended)

1. Set up a backend server with Vectara RAG
2. Implement the `/api/search` endpoint
3. Update the API endpoint in your code if needed

**Backend Requirements**:

- Accept POST requests to `/search`
- Expected request body:
  ```json
  {
    "query": "user question",
    "repo": "owner/repository"
  }
  ```
- Return response:
  ```json
  {
    "answer": "AI-generated answer",
    "sources": [
      {
        "file": "path/to/file.ts",
        "snippet": "code snippet",
        "repo": "owner/repository",
        "url": "https://github.com/..."
      }
    ]
  }
  ```

## WebSocket Setup

For full voice features, you need a WebSocket server:

### Option A: Gemini Live API

1. Sign up for Google Cloud
2. Enable Gemini API
3. Get API credentials
4. Deploy a WebSocket proxy
5. Update `NEXT_PUBLIC_GEMINI_WS_URL`

### Option B: Mock WebSocket Server

Create a simple mock server for testing:

```javascript
// mock-ws-server.js
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    // Echo back as transcript
    if (message instanceof Buffer) {
      // Mock transcript
      ws.send(
        JSON.stringify({
          type: "transcript",
          text: "This is a mock transcript",
          isFinal: true,
        })
      );
    }
  });
});
```

Run it: `node mock-ws-server.js`

## Common Issues

### Issue: "Cannot connect to WebSocket"

**Solution**: Make sure your WebSocket URL is correct and the server is running. For testing, you can skip voice features and use text mode.

### Issue: "Microphone permission denied"

**Solution**:

- Check browser settings
- Ensure you're using HTTPS (or localhost)
- Try a different browser

### Issue: "No results from search"

**Solution**: The mock API returns placeholder data. To get real results, integrate with Vectara RAG backend.

### Issue: "Build errors"

**Solution**:

```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm dev
```

## Next Steps

Now that you have the app running:

1. **Customize the UI**: Edit colors in `src/lib/constants.ts`
2. **Add real backend**: Integrate with Vectara RAG
3. **Configure Gemini**: Set up voice API integration
4. **Add repositories**: Index your code repositories
5. **Deploy**: Deploy to Vercel or your preferred platform

## Getting Help

- **Documentation**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Examples**: Check component files in `src/components/`
- **Issues**: Create an issue on GitHub

## Demo Mode

Want to see it in action without full setup?

1. Start the dev server: `pnpm dev`
2. Add any GitHub URL (mock indexing works)
3. Use text mode to ask questions (returns mock data)
4. See the beautiful UI and animations!

The app is fully functional in UI/UX terms, and you can integrate real APIs gradually.

---

Happy coding! 🚀
