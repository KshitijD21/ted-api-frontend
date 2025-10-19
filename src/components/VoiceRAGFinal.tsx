"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Volume2,
  StopCircle,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { useVoiceRAGFinal } from "@/hooks/useVoiceRAGFinal";

/**
 * ✅ FINAL WORKING VERSION - Voice RAG Chat Component
 *
 * Full voice conversation with Gemini AI enhanced by Vectara RAG
 *
 * Features:
 * - Real-time speech-to-text
 * - Automatic knowledge base search
 * - Context-enhanced responses
 * - Audio playback
 * - Conversation history
 */

export default function VoiceRAGChatFinal() {
  const [apiKey, setApiKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);

  // Initialize voice RAG mode
  const {
    isActive,
    isConnected,
    isListening,
    isGeminiSpeaking,
    currentTranscript,
    interimTranscript,
    conversationHistory,
    retrievedDocs,
    statusMessage,
    start,
    stop,
    isRAGEnabled,
  } = useVoiceRAGFinal({
    apiKey,
    ragEnabled: true,
    numResults: 3,
    maxResponseWords: 100,
    onError: (error) => {
      console.error("Voice RAG error:", error);
      alert(`Error: ${error.message}`);
    },
  });

  // Check for API key on mount
  useEffect(() => {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      setApiKey(geminiKey);
      setIsKeySet(true);
    } else {
      const storedKey = localStorage.getItem("GEMINI_API_KEY");
      if (storedKey) {
        setApiKey(storedKey);
        setIsKeySet(true);
      }
    }
  }, []);

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("GEMINI_API_KEY", apiKey);
      setIsKeySet(true);
    }
  };

  const handleStart = async () => {
    try {
      await start();
    } catch (error) {
      console.error("Failed to start:", error);
    }
  };

  const handleStop = async () => {
    try {
      await stop();
    } catch (error) {
      console.error("Failed to stop:", error);
    }
  };

  // Status indicators
  const getStatusBadge = () => {
    if (!isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (!isConnected) return <Badge variant="destructive">Connecting...</Badge>;
    if (isGeminiSpeaking)
      return (
        <Badge className="bg-purple-500 animate-pulse">
          🤖 Gemini Speaking
        </Badge>
      );
    if (isListening)
      return (
        <Badge className="bg-green-500 animate-pulse">🎤 Listening...</Badge>
      );
    return <Badge className="bg-blue-500">🎧 Ready</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              🎙️ Voice RAG Chat - Final Version
            </CardTitle>
            <CardDescription className="text-gray-300">
              Talk with AI enhanced by your knowledge base (Vectara RAG)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* API Key Setup */}
        {!isKeySet && (
          <Card className="bg-black/30 backdrop-blur-lg border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">
                🔑 Gemini API Key Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="password"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 bg-black/50 border border-gray-600 rounded-lg text-white"
              />
              <Button
                onClick={handleSetApiKey}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Set API Key
              </Button>
              <p className="text-xs text-gray-400">
                Get your API key from:{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        {isKeySet && (
          <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
            <CardContent className="pt-6 space-y-4">
              {/* Status Bar */}
              <div className="flex items-center justify-between p-4 bg-black/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">Status:</span>
                    {getStatusBadge()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">RAG:</span>
                    <Badge
                      variant={isRAGEnabled ? "default" : "secondary"}
                      className="bg-green-600"
                    >
                      {isRAGEnabled ? "✅ Active" : "⚠️ Disabled"}
                    </Badge>
                  </div>
                  {statusMessage && (
                    <div className="text-sm text-gray-400">{statusMessage}</div>
                  )}
                </div>

                {/* Main Control Button */}
                <Button
                  onClick={isActive ? handleStop : handleStart}
                  size="lg"
                  className={`w-32 h-32 rounded-full text-2xl ${
                    isActive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {isActive ? <StopCircle size={48} /> : <Mic size={48} />}
                </Button>
              </div>

              {/* Current Transcript */}
              {(currentTranscript || interimTranscript) && (
                <Card className="bg-blue-950/50 border-blue-500/30">
                  <CardContent className="pt-4 space-y-2">
                    <div className="text-sm text-gray-400">
                      {isListening ? "🎤 You are saying:" : "📝 You said:"}
                    </div>
                    <div className="text-white font-medium">
                      {isListening ? interimTranscript : currentTranscript}
                    </div>
                    {isListening && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Radio
                          size={14}
                          className="animate-pulse text-red-500"
                        />
                        <span>Listening... keep speaking</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Retrieved Documents */}
        {retrievedDocs.length > 0 && (
          <Card className="bg-black/30 backdrop-blur-lg border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400">
                📚 Retrieved Context from Knowledge Base
              </CardTitle>
              <CardDescription className="text-gray-300">
                Found {retrievedDocs.length} relevant documents in Vectara
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {retrievedDocs.map((doc, index) => (
                <Card key={index} className="bg-black/50 border-green-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-green-600">
                        Relevance: {(doc.score * 100).toFixed(1)}%
                      </Badge>
                      <Badge variant="outline" className="text-gray-400">
                        Source #{index + 1}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-4 mb-2">
                      {doc.text}
                    </p>
                    {doc.metadata && doc.metadata.path && (
                      <div className="text-xs text-gray-500">
                        📁 {doc.metadata.path}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400">
                💬 Conversation History
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your questions enhanced with knowledge base context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {conversationHistory.map((entry, index) => (
                <Card key={index} className="bg-black/50 border-purple-500/20">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </Badge>
                      <Badge className="bg-purple-600">
                        {entry.contextDocs.length} sources used
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Question:</div>
                      <div className="text-white bg-blue-950/30 p-3 rounded">
                        {entry.userQuestion}
                      </div>
                    </div>

                    {entry.contextDocs.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">
                          Top source (relevance:{" "}
                          {(entry.contextDocs[0].score * 100).toFixed(1)}%):
                        </div>
                        <div className="text-xs text-gray-400 bg-black/30 p-2 rounded line-clamp-2">
                          {entry.contextDocs[0].text.substring(0, 150)}...
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-black/30 backdrop-blur-lg border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-gray-300">💡 How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
              <p>Click the microphone button to start</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
              <p>
                Speak your question clearly (e.g., "Explain my project
                structure")
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
              <p>
                AI searches your Vectara knowledge base for relevant context
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
              <p>Gemini generates a response using the retrieved context</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
              <p>Listen to the AI's voice response through your speakers</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-1 text-green-500" />
              <p>Use headphones to prevent audio feedback</p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Status */}
        <Card className="bg-black/30 backdrop-blur-lg border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-gray-300">⚙️ System Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Gemini API:</span>
              <Badge variant={isKeySet ? "default" : "destructive"}>
                {isKeySet ? "✅ Set" : "❌ Not Set"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gemini Connected:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "✅ Yes" : "⏸️ No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Vectara RAG:</span>
              <Badge variant={isRAGEnabled ? "default" : "secondary"}>
                {isRAGEnabled ? "✅ Active" : "⚠️ Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Speech Recognition:</span>
              <Badge variant="default">
                {typeof window !== "undefined" &&
                ((window as any).SpeechRecognition ||
                  (window as any).webkitSpeechRecognition)
                  ? "✅ Ready"
                  : "❌ Not Available"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
