"use client";

import { useState } from "react";
import { Message } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User, Bot, FileText } from "lucide-react";
import { COLORS } from "@/lib/constants";
import { SourcesView } from "./SourcesView";

interface MessageBubbleProps {
  message: Message;
  index: number;
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";
  const color = isUser ? COLORS.user : COLORS.ai;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <Avatar
        className="h-10 w-10 border-2"
        style={{ borderColor: color.light }}
      >
        <AvatarFallback style={{ backgroundColor: color.bg }}>
          {isUser ? (
            <User className="h-5 w-5" style={{ color: color.primary }} />
          ) : (
            <Bot className="h-5 w-5" style={{ color: color.primary }} />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={`flex-1 max-w-2xl ${
          isUser ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {/* Name and Time */}
        <div
          className={`flex items-center gap-2 mb-1 text-xs text-muted-foreground ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="font-medium">{isUser ? "You" : "Assistant"}</span>
          <span>•</span>
          <span>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Message Bubble */}
        <Card
          className={`p-4 shadow-md border ${
            isUser ? "rounded-tr-none" : "rounded-tl-none"
          }`}
          style={{
            backgroundColor: color.bg,
            borderColor: color.light,
          }}
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Sources Button */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div
              className="mt-3 pt-3 border-t"
              style={{ borderColor: color.light }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(!showSources)}
                className="h-8 text-xs"
                style={{ color: color.primary }}
              >
                <FileText className="h-3 w-3 mr-1" />
                {showSources ? "Hide" : "View"} sources (
                {message.sources.length})
              </Button>
            </div>
          )}
        </Card>

        {/* Sources */}
        {showSources && message.sources && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 w-full"
          >
            <SourcesView sources={message.sources} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

interface ChatTimelineProps {
  messages: Message[];
}

export function ChatTimeline({ messages }: ChatTimelineProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Bot className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-muted-foreground">
          Start a conversation using voice or text
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto px-4 pb-4">
      {messages.map((message, index) => (
        <MessageBubble key={message.id} message={message} index={index} />
      ))}
    </div>
  );
}
