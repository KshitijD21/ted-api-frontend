"use client";

import { Bot, Copy, ChevronDown } from "lucide-react";
import { Message } from "@/types/chat";
import { useStreamingText } from "@/hooks/useStreamingText";
import { useState } from "react";
import { SourcesSection } from "./SourcesSection";

interface AIMessageProps {
  message: Message;
  onRegenerate?: () => void;
  isLatest?: boolean;
}

export function AIMessage({
  message,
  onRegenerate,
  isLatest = false,
}: AIMessageProps) {
  const { displayedText, isComplete } = useStreamingText(message.content, {
    speed: message.streaming ? 30 : 0,
  });
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-start items-start gap-3 px-10 py-3 animate-fadeIn">
      {/* AI Avatar - subtle, small */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center mt-1 border border-purple-500/20">
        <Bot className="w-4 h-4 text-purple-400" />
      </div>

      {/* Message Content */}
      <div className="flex flex-col flex-1 max-w-[75%]">
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl rounded-tl-md px-4 py-3 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <div className="prose prose-sm max-w-none">
            <p className="text-base leading-relaxed text-white whitespace-pre-wrap break-words mb-0">
              {message.streaming ? displayedText : message.content}
              {message.streaming && !isComplete && (
                <span className="inline-block w-0.5 h-5 bg-purple-400 ml-1 animate-pulse">
                  |
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons & Timestamp */}
        {isComplete && (
          <div className="flex items-center gap-3 mt-2 px-1">
            <button
              onClick={handleCopy}
              className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 transition-colors"
              title="Copy response"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy"}
            </button>

            {/* Sources Toggle */}
            {message.sources && message.sources.length > 0 && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                View {message.sources.length} source
                {message.sources.length > 1 ? "s" : ""}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    showSources ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}

            <span className="text-xs text-gray-500 ml-auto">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Sources Section - Expandable */}
        {message.sources &&
          message.sources.length > 0 &&
          isComplete &&
          showSources && (
            <div className="mt-3">
              <SourcesSection sources={message.sources} />
            </div>
          )}
      </div>
    </div>
  );
}
