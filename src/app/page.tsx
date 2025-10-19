"use client";

import { useState, useEffect } from "react";
import { RepoManagementPanel } from "@/components/RepoManagementPanel";
import { VoiceModeToggle } from "@/components/VoiceModeToggle";
import { LiveTranscript } from "@/components/LiveTranscript";
import { ChatTimeline } from "@/components/ChatTimeline";
import { TextInputFallback } from "@/components/TextInputFallback";
import { VoiceTest } from "@/components/VoiceTest";
import { useRepositories } from "@/hooks/useRepositories";
import { useVoiceMode } from "@/hooks/useVoiceMode";
import { useChat } from "@/hooks/useChat";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Keyboard, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [showTextInput, setShowTextInput] = useState(false);

  const {
    repositories,
    activeRepo,
    addRepository,
    switchRepository,
    removeRepository,
  } = useRepositories();

  const {
    voiceState,
    currentTranscript,
    transcript,
    startVoiceMode,
    stopVoiceMode,
    setThinking,
    resetToListening,
    sendTextForTTS,
  } = useVoiceMode();

  const { messages, isLoading: chatLoading, handleUserQuery } = useChat();

  // Handle completed transcripts
  useEffect(() => {
    const lastTranscript = transcript[transcript.length - 1];
    if (lastTranscript && lastTranscript.isFinal) {
      // Set thinking state
      setThinking();

      // Send query to backend
      handleUserQuery(lastTranscript.text).then((result) => {
        if (result) {
          // Send answer to TTS
          sendTextForTTS(result.summary);
        }
        resetToListening();
      });
    }
  }, [
    transcript,
    handleUserQuery,
    setThinking,
    resetToListening,
    sendTextForTTS,
  ]);

  const handleVoiceToggle = async () => {
    if (voiceState === "idle") {
      const success = await startVoiceMode();
      if (success) {
        setShowTextInput(false);
      }
    } else {
      stopVoiceMode();
    }
  };

  const handleTextQuery = async (text: string) => {
    const result = await handleUserQuery(text);
    if (result && voiceState !== "idle") {
      sendTextForTTS(result.summary);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toaster for notifications */}
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Voice Code Assistant
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTextInput(!showTextInput)}
              aria-label="Toggle input mode"
            >
              {showTextInput ? (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Mode
                </>
              ) : (
                <>
                  <Keyboard className="h-4 w-4 mr-2" />
                  Type Instead
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Test Section */}
        <section aria-label="API test">
          <VoiceTest />
        </section>

        {/* Repository Management */}
        <section aria-label="Repository management">
          <RepoManagementPanel
            repositories={repositories}
            activeRepo={activeRepo}
            onAddRepo={addRepository}
            onSwitchRepo={switchRepository}
            onRemoveRepo={removeRepository}
          />
        </section>

        {/* Voice Control Section */}
        <section
          className="py-12 flex flex-col items-center justify-center space-y-8"
          aria-label="Voice interaction"
        >
          {/* Voice Mode Toggle */}
          <VoiceModeToggle
            voiceState={voiceState}
            onToggle={handleVoiceToggle}
            disabled={chatLoading}
          />

          {/* Live Transcript */}
          <LiveTranscript
            text={currentTranscript}
            isActive={voiceState !== "idle"}
          />

          {/* Text Input Fallback */}
          <AnimatePresence>
            {showTextInput && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full"
              >
                <TextInputFallback
                  onSubmit={handleTextQuery}
                  isLoading={chatLoading}
                  disabled={false}
                  placeholder="Ask a question about your code..."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Chat Timeline */}
        <section
          className="max-w-4xl mx-auto"
          aria-label="Conversation history"
        >
          <ChatTimeline messages={messages} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-6 bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Gemini Flash 2.5 Live API, Vectara RAG, and Next.js</p>
        </div>
      </footer>
    </div>
  );
}
