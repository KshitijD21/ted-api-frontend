"use client";

import { Message } from "@/types/chat";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end items-start gap-3 px-10 py-3 animate-fadeIn">
      <div className="flex flex-col items-end max-w-[70%]">
        <div className="bg-secondary text-foreground rounded-2xl rounded-tr-md px-4 py-3 shadow-card">
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
