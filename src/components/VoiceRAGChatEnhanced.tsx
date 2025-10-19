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
import { Mic, MicOff, Volume2, VolumeX, Radio, StopCircle } from "lucide-react";
import { useVoiceModeWithRAGEnhanced } from "@/hooks/useVoiceModeWithRAGEnhanced";

/**
 * VoiceRAG Chat Component
 *
 * Full-duplex voice conversation with Gemini AI + RAG
 * Implements Python's AudioLoopWithRAG in TypeScript
 *
 * Features:
 * - Real-time voice input with automatic silence detection
 * - Speech-to-text transcription
 * - Vectara RAG knowledge base search
 * - Context-enhanced responses from Gemini
 * - Audio playback of Gemini's responses
 * - Interruption support (speak while Gemini talks)
 * - Conversation history with retrieved sources
 */

export default function VoiceRAGChatEnhanced() {
  const [apiKey, setApiKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);

  // Initialize voice mode with RAG
  const {
    isActive,
    isConnected,
    isRecording,
    isGeminiSpeaking,
    audioLevel,
    currentTranscript,
    conversationHistory,
    retrievedDocs,
    start,
    stop,
    isRAGEnabled,
  } = useVoiceModeWithRAGEnhanced({
    apiKey,
    ragEnabled: true,
    numResults: 3,
    maxResponseWords: 100,
    onTranscript: (text, isFinal) => {
      console.log("Transcript:", text, "Final:", isFinal);
    },
    onError: (error) => {
      console.error("Voice mode error:", error);
      alert(`Error: ${error.message}`);
    },
  });

  // Check for API key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("GEMINI_API_KEY");
    if (storedKey) {
      setApiKey(storedKey);
      setIsKeySet(true);
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

  // Calculate audio level bar width (0-100%)
  const audioLevelPercent = Math.min(100, (audioLevel / 300) * 100);

  // Status indicators
  const getStatusBadge = () => {
    if (!isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (!isConnected) return <Badge variant="destructive">Connecting...</Badge>;
    if (isGeminiSpeaking)
      return <Badge className="bg-purple-500">🤖 Gemini Speaking</Badge>;
    if (isRecording)
      return <Badge className="bg-green-500">🎤 Recording</Badge>;
    return <Badge className="bg-blue-500">🎧 Listening</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              🎙️ Voice RAG Chat with Gemini 2.0
            </CardTitle>
            <CardDescription className="text-gray-300">
              Talk naturally with AI enhanced by your knowledge base
            </CardDescription>
          </CardHeader>
        </Card>

        {/* API Key Setup */}
        {!isKeySet && (
          <Card className="bg-black/30 backdrop-blur-lg border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">
                🔑 API Key Required
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
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        {isKeySet && (
          <Card className="bg-black/30 backdrop-blur-lg border-purple-500/30">
            <CardContent className="pt-6 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">Status:</span>
                    {getStatusBadge()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">RAG:</span>
                    <Badge variant={isRAGEnabled ? "default" : "secondary"}>
                      {isRAGEnabled ? "✅ Enabled" : "⚠️ Disabled"}
                    </Badge>
                  </div>
                </div>

                {/* Main Control Button */}
                <Button
                  onClick={isActive ? handleStop : handleStart}
                  size="lg"
                  className={`w-32 h-32 rounded-full text-2xl ${
                    isActive
                      ? "bg-red-600 hover:bg-red-700 animate-pulse"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {isActive ? <StopCircle size={48} /> : <Mic size={48} />}
                </Button>
              </div>

              {/* Audio Level Indicator */}
              {isActive && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Audio Level</span>
                    <span>{audioLevel}</span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        isGeminiSpeaking ? "bg-purple-500" : "bg-green-500"
                      }`}
                      style={{ width: `${audioLevelPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {isGeminiSpeaking ? (
                      <>
                        <Volume2 size={16} />
                        <span>
                          Gemini is speaking (you can interrupt by talking)
                        </span>
                      </>
                    ) : isRecording ? (
                      <>
                        <Radio
                          size={16}
                          className="animate-pulse text-red-500"
                        />
                        <span>
                          Recording your voice... Stop speaking for 1.5s to send
                        </span>
                      </>
                    ) : (
                      <>
                        <Mic size={16} />
                        <span>Start speaking (minimum 2 seconds)</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Current Transcript */}
              {currentTranscript && (
                <Card className="bg-blue-950/50 border-blue-500/30">
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-400 mb-1">
                      Your last input:
                    </div>
                    <div className="text-white">{currentTranscript}</div>
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
                📚 Retrieved Context
              </CardTitle>
              <CardDescription className="text-gray-300">
                Relevant documents found in your knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {retrievedDocs.map((doc, index) => (
                <Card key={index} className="bg-black/50 border-green-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-green-600">
                        Score: {doc.score.toFixed(3)}
                      </Badge>
                      <Badge variant="outline" className="text-gray-400">
                        Source #{index + 1}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3">
                      {doc.text}
                    </p>
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
                Your interactions with context-enhanced AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {conversationHistory.map((entry, index) => (
                <Card key={index} className="bg-black/50 border-purple-500/20">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </Badge>
                      <Badge className="bg-purple-600">
                        {entry.contextDocs.length} sources used
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">You asked:</div>
                      <div className="text-white bg-blue-950/30 p-2 rounded">
                        {entry.user}
                      </div>
                    </div>
                    {entry.contextDocs.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Top source (score:{" "}
                        {entry.contextDocs[0].score.toFixed(3)}):{" "}
                        {entry.contextDocs[0].text.substring(0, 100)}...
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
            <CardTitle className="text-gray-300">💡 How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-400">
            <p>1. Click the microphone button to start</p>
            <p>2. Speak your question clearly (minimum 2 seconds)</p>
            <p>3. Stop speaking for 1.5 seconds to automatically process</p>
            <p>4. AI will search your knowledge base for relevant context</p>
            <p>5. Listen to the AI's response through your speakers</p>
            <p>6. You can interrupt the AI by speaking while it's talking</p>
            <p>7. Use headphones to prevent audio feedback</p>
          </CardContent>
        </Card>

        {/* Configuration Status */}
        <Card className="bg-black/30 backdrop-blur-lg border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-gray-300">⚙️ Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Gemini API:</span>
              <Badge variant={isKeySet ? "default" : "destructive"}>
                {isKeySet ? "Configured" : "Not Set"}
              </Badge>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Vectara RAG:</span>
              <Badge variant={isRAGEnabled ? "default" : "secondary"}>
                {isRAGEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Web Speech API:</span>
              <Badge variant="default">
                {typeof window !== "undefined" &&
                ((window as any).SpeechRecognition ||
                  (window as any).webkitSpeechRecognition)
                  ? "Available"
                  : "Not Available"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
