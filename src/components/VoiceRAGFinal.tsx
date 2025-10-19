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
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceRAGFinal } from "@/hooks/useVoiceRAGFinal";
import { AISpectrumOrb } from "@/components/AISpectrumOrb";
import { ChatBubble } from "@/components/ChatBubble";

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
      // Play welcome sound
      const { VoiceAudio } = await import("@/lib/voice-audio");
      VoiceAudio.playWelcome();

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
    if (!isActive)
      return (
        <Badge
          variant="secondary"
          className="bg-white/5 text-gray-400 border-0"
        >
          Inactive
        </Badge>
      );
    if (!isConnected)
      return (
        <Badge
          variant="destructive"
          className="bg-red-500/10 text-red-400 border-0"
        >
          Connecting...
        </Badge>
      );
    if (isGeminiSpeaking)
      return (
        <Badge className="bg-purple-500/20 text-purple-300 animate-pulse border-0">
          🤖 Gemini Speaking
        </Badge>
      );
    if (isListening)
      return (
        <Badge className="bg-green-500/20 text-green-300 animate-pulse border-0">
          🎤 Listening...
        </Badge>
      );
    return (
      <Badge className="bg-blue-500/20 text-blue-300 border-0">🎧 Ready</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects - matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-16 space-y-24">
        {/* Floating Header */}
        <div className="backdrop-blur-xl bg-white/[0.02] rounded-3xl p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
          <h1 className="text-6xl font-extralight text-white mb-4 tracking-tight">
            Voice{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              RAG
            </span>{" "}
            Chat
          </h1>
          <p className="text-lg text-gray-400 font-light">
            Talk with AI enhanced by your knowledge base
          </p>
        </div>

        {/* API Key Setup - Glassmorphic Card */}
        {!isKeySet && (
          <div className="backdrop-blur-xl bg-yellow-500/[0.03] rounded-3xl p-12 shadow-[0_20px_60px_-15px_rgba(234,179,8,0.2)] border border-yellow-500/10">
            <h2 className="text-3xl font-light text-yellow-300 mb-8">
              🔑 Gemini API Key Required
            </h2>
            <div className="space-y-6">
              <input
                type="password"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-8 py-6 bg-black/50 backdrop-blur-xl rounded-2xl text-white text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300 border border-white/5"
              />
              <Button
                onClick={handleSetApiKey}
                className="w-full py-6 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all duration-300 rounded-2xl font-medium"
              >
                Set API Key
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Get your API key from:{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          </div>
        )}

        {/* AI Spectrum Orb - THE Centerpiece */}
        {isKeySet && (
          <div className="flex flex-col items-center space-y-16">
            {/* AI Orb Container */}
            <div className="relative">
              {/* Status badges floating above orb */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-24 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20"
              >
                {getStatusBadge()}
                {isRAGEnabled && (
                  <Badge className="bg-green-500/20 text-green-300 border-0 backdrop-blur-xl px-4 py-2">
                    RAG Active
                  </Badge>
                )}
              </motion.div>

              {/* The AI Spectrum Orb */}
              <AISpectrumOrb
                isListening={isListening}
                isSpeaking={isGeminiSpeaking}
                isActive={isActive}
                audioLevel={0.5}
              />

              {/* Microphone button overlaid on orb */}
              <motion.button
                onClick={isActive ? handleStop : handleStart}
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full transition-all duration-500 ${
                  isActive
                    ? "bg-gradient-to-br from-red-500/80 to-red-600/80"
                    : "bg-gradient-to-br from-purple-500/80 to-pink-500/80"
                } backdrop-blur-xl border-2 border-white/30 hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(0,0,0,0.3)] z-10`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive ? (
                  <StopCircle size={40} className="mx-auto text-white" />
                ) : (
                  <Mic size={40} className="mx-auto text-white" />
                )}
              </motion.button>

              {/* Status message floating below */}
              <AnimatePresence>
                {statusMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center"
                  >
                    <p className="text-base text-gray-400 font-light">
                      {statusMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Current Transcript - Minimalist floating text */}
            <AnimatePresence>
              {(currentTranscript || interimTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="w-full max-w-3xl backdrop-blur-xl bg-white/[0.02] rounded-3xl p-8 border border-white/10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)]"
                >
                  <div className="text-sm text-gray-500 mb-4 font-light">
                    {isListening ? "🎤 You are saying:" : "📝 You said:"}
                  </div>
                  <div className="text-white text-xl font-light leading-relaxed mb-4">
                    {isListening ? interimTranscript : currentTranscript}
                  </div>
                  {isListening && (
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Radio size={16} className="animate-pulse text-red-400" />
                      <span>Listening... keep speaking</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Retrieved Documents - More spacious */}
        {retrievedDocs.length > 0 && (
          <div className="backdrop-blur-xl bg-white/[0.02] rounded-3xl p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-green-500/10">
            <h2 className="text-3xl font-light text-green-300 mb-4">
              📚 Retrieved Context
            </h2>
            <p className="text-gray-400 mb-10 font-light">
              Found {retrievedDocs.length} relevant documents in your knowledge
              base
            </p>
            <div className="space-y-6">
              {retrievedDocs.map((doc, index) => (
                <div
                  key={index}
                  className="backdrop-blur-xl bg-black/30 rounded-2xl p-8 border border-green-500/5 hover:border-green-500/20 transition-all duration-300 hover:translate-y-[-2px]"
                >
                  <div className="flex items-start justify-between mb-6">
                    <Badge className="bg-green-500/20 text-green-300 border-0 px-4 py-1">
                      Relevance: {(doc.score * 100).toFixed(1)}%
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-gray-500 border-gray-700 px-4 py-1"
                    >
                      Source #{index + 1}
                    </Badge>
                  </div>
                  <p className="text-base text-gray-300 line-clamp-4 mb-4 leading-relaxed font-light">
                    {doc.text}
                  </p>
                  {doc.metadata && doc.metadata.path && (
                    <div className="text-sm text-gray-600">
                      📁 {doc.metadata.path}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Timeline - Perplexity-style Chat */}
        {conversationHistory.length > 0 && (
          <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-light text-gray-300 mb-2">
                Conversation Timeline
              </h2>
              <p className="text-sm text-gray-500 font-light">
                {conversationHistory.length} exchange
                {conversationHistory.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-8">
              {conversationHistory.map((entry, index) => (
                <div key={index} className="space-y-6">
                  {/* User question */}
                  <ChatBubble
                    message={entry.userQuestion}
                    isUser={true}
                    timestamp={new Date(entry.timestamp)}
                    index={index * 2}
                  />

                  {/* AI response (if we have the response text) */}
                  {entry.contextDocs.length > 0 && (
                    <ChatBubble
                      message={`Based on ${entry.contextDocs.length} source${
                        entry.contextDocs.length > 1 ? "s" : ""
                      } from your knowledge base...`}
                      isUser={false}
                      timestamp={new Date(entry.timestamp)}
                      sources={entry.contextDocs.length}
                      index={index * 2 + 1}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Fade at bottom */}
            <div className="h-32 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Instructions - Cleaner design */}
        <div className="backdrop-blur-xl bg-white/[0.02] rounded-3xl p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5">
          <h2 className="text-2xl font-light text-gray-300 mb-10">
            💡 How It Works
          </h2>
          <div className="space-y-5 text-base text-gray-400 font-light">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" />
              <p>Click the microphone button to start</p>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" />
              <p>
                Speak your question clearly (e.g., "Explain my project
                structure")
              </p>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" />
              <p>
                AI searches your Vectara knowledge base for relevant context
              </p>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" />
              <p>Gemini generates a response using the retrieved context</p>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" />
              <p>Listen to the AI's voice response through your speakers</p>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" />
              <p>Use headphones to prevent audio feedback</p>
            </div>
          </div>
        </div>

        {/* System Status - More minimal */}
        <div className="backdrop-blur-xl bg-white/[0.02] rounded-3xl p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5">
          <h2 className="text-2xl font-light text-gray-300 mb-10">
            ⚙️ System Status
          </h2>
          <div className="grid grid-cols-2 gap-8 text-base">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-light">Gemini API</span>
              <Badge
                variant={isKeySet ? "default" : "destructive"}
                className={`${
                  isKeySet
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                } border-0 px-4 py-1`}
              >
                {isKeySet ? "✅ Set" : "❌ Not Set"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-light">Gemini Connected</span>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={`${
                  isConnected
                    ? "bg-green-500/20 text-green-300"
                    : "bg-gray-500/20 text-gray-400"
                } border-0 px-4 py-1`}
              >
                {isConnected ? "✅ Yes" : "⏸️ No"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-light">Vectara RAG</span>
              <Badge
                variant={isRAGEnabled ? "default" : "secondary"}
                className={`${
                  isRAGEnabled
                    ? "bg-green-500/20 text-green-300"
                    : "bg-gray-500/20 text-gray-400"
                } border-0 px-4 py-1`}
              >
                {isRAGEnabled ? "✅ Active" : "⚠️ Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-light">
                Speech Recognition
              </span>
              <Badge
                variant="default"
                className={`${
                  typeof window !== "undefined" &&
                  ((window as any).SpeechRecognition ||
                    (window as any).webkitSpeechRecognition)
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                } border-0 px-4 py-1`}
              >
                {typeof window !== "undefined" &&
                ((window as any).SpeechRecognition ||
                  (window as any).webkitSpeechRecognition)
                  ? "✅ Ready"
                  : "❌ Not Available"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
