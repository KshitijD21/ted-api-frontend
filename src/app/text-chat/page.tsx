"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInput } from "@/components/chat/ChatInput";
import { UserMessage } from "@/components/chat/UserMessage";
import { AIMessage } from "@/components/chat/AIMessage";
import { Message, ChatHistory, ChatStore, SearchResponse } from "@/types/chat";
import {
  loadChatStore,
  saveChatStore,
  createConversation,
  addMessageToConversation,
  updateConversation,
  deleteConversation,
  getConversation,
  setActiveConversation,
} from "@/lib/chatStorage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8200";

export default function ChatPage() {
  const [store, setStore] = useState<ChatStore>({
    conversations: [],
    activeConversationId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat store on mount
  useEffect(() => {
    const loadedStore = loadChatStore();
    setStore(loadedStore);
  }, []);

  // Save to localStorage whenever store changes
  useEffect(() => {
    saveChatStore(store);
  }, [store]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [store.activeConversationId, store.conversations]);

  // Get active conversation
  const activeConversation = store.activeConversationId
    ? getConversation(store, store.activeConversationId)
    : null;

  // Handle new chat
  const handleNewChat = () => {
    const newConversation = createConversation();
    setStore({
      conversations: [newConversation, ...store.conversations],
      activeConversationId: newConversation.id,
    });
    setError(null);
  };

  // Handle select conversation
  const handleSelectConversation = (id: string) => {
    setStore(setActiveConversation(store, id));
    setError(null);
  };

  // Handle delete conversation
  const handleDeleteConversation = (id: string) => {
    setStore(deleteConversation(store, id));
  };

  // Handle send message
  const handleSendMessage = async (content: string) => {
    try {
      setError(null);

      // Create or get active conversation
      let conversationId = store.activeConversationId;
      let currentStore = store;

      if (!conversationId) {
        const newConversation = createConversation(content);
        conversationId = newConversation.id;
        currentStore = {
          conversations: [newConversation, ...store.conversations],
          activeConversationId: conversationId,
        };
        setStore(currentStore);
      }

      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      currentStore = updateConversation(currentStore, conversationId, (conv) =>
        addMessageToConversation(conv, userMessage)
      );
      setStore(currentStore);

      // Call backend API
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: content,
          limit: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();

      // Add AI message with streaming effect
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.summary,
        sources: data.sources,
        timestamp: new Date(),
        streaming: true,
      };

      currentStore = updateConversation(currentStore, conversationId, (conv) =>
        addMessageToConversation(conv, aiMessage)
      );
      setStore(currentStore);

      // After animation completes, disable streaming
      setTimeout(() => {
        setStore((prevStore) =>
          updateConversation(prevStore, conversationId!, (conv) => ({
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === aiMessage.id ? { ...msg, streaming: false } : msg
            ),
          }))
        );
      }, data.summary.split(" ").length * 30 + 500);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;

    const lastUserMessage = [...activeConversation.messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (lastUserMessage) {
      const updatedMessages = activeConversation.messages.slice(0, -1);
      setStore(
        updateConversation(store, activeConversation.id, (conv) => ({
          ...conv,
          messages: updatedMessages,
        }))
      );
      await handleSendMessage(lastUserMessage.content);
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Background Effects - matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      {/* Sidebar */}
      <div className="relative z-10">
        <ChatSidebar
          conversations={store.conversations}
          activeConversationId={store.activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Simple Header */}
        <header className="border-b border-white/5 bg-black/30 backdrop-blur-xl">
          <div className="px-10 py-4 flex items-center">
            <span className="text-base font-medium text-white">CodeVoice</span>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          {activeConversation && activeConversation.messages.length > 0 ? (
            <div className="max-w-5xl mx-auto py-6">
              {activeConversation.messages.map((message) =>
                message.role === "user" ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <AIMessage
                    key={message.id}
                    message={message}
                    onRegenerate={handleRegenerate}
                    isLatest={
                      message.id ===
                      activeConversation.messages[
                        activeConversation.messages.length - 1
                      ]?.id
                    }
                  />
                )
              )}

              {/* Loading Indicator - Minimal */}
              {isLoading && (
                <div className="flex items-start gap-3 px-10 py-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-primary rounded-full animate-pulse-dot"></span>
                      <span
                        className="w-1 h-1 bg-primary rounded-full animate-pulse-dot"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                      <span
                        className="w-1 h-1 bg-primary rounded-full animate-pulse-dot"
                        style={{ animationDelay: "0.4s" }}
                      ></span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground mt-1">
                    Thinking...
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mx-10 my-3 p-4 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            // Empty State - Clean & Minimal
            <div className="flex items-center justify-center h-full px-10">
              <div className="text-center max-w-2xl">
                {/* Heading */}
                <h1 className="text-5xl font-extralight text-white mb-3 tracking-tight">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                    CodeVoice
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-gray-400 font-light mb-8">
                  Ask questions about your codebase
                </p>

                {/* Suggestion Chips - Glassmorphic style */}
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  <button
                    onClick={() =>
                      handleSendMessage("Explain the search functionality")
                    }
                    className="px-6 py-3 text-sm text-gray-300 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-full hover:border-purple-500/30 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    Explain search functionality
                  </button>
                  <button
                    onClick={() =>
                      handleSendMessage("Show authentication code")
                    }
                    className="px-6 py-3 text-sm text-gray-300 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-full hover:border-purple-500/30 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    Show authentication code
                  </button>
                  <button
                    onClick={() =>
                      handleSendMessage("Describe project structure")
                    }
                    className="px-6 py-3 text-sm text-gray-300 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-full hover:border-purple-500/30 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    Describe project structure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar - Fixed at Bottom */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="Ask about your codebase..."
        />
      </div>
    </div>
  );
}
