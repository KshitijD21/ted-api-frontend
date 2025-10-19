"use client";

import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  sources?: number;
  index: number;
}

export function ChatBubble({
  message,
  isUser,
  timestamp,
  sources = 0,
  index,
}: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar for AI */}
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Message content */}
      <div
        className={`flex flex-col ${
          isUser ? "items-end" : "items-start"
        } max-w-[70%]`}
      >
        {/* Message bubble */}
        <div
          className={`relative group ${
            isUser
              ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30"
              : "bg-white/[0.03] backdrop-blur-xl border border-white/10"
          } rounded-2xl px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)] hover:translate-y-[-2px]`}
        >
          {/* Shimmer effect on AI messages */}
          {!isUser && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>
          )}

          <p className="text-gray-100 text-base leading-relaxed font-light relative z-10">
            {message}
          </p>

          {/* Sources indicator for AI responses */}
          {!isUser && sources > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <span className="text-xs text-purple-400 font-light">
                {sources} source{sources > 1 ? "s" : ""} used
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-600 mt-2 font-light">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-300" />
        </div>
      )}
    </motion.div>
  );
}
