"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TextInputFallbackProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function TextInputFallback({
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "Type your question...",
}: TextInputFallbackProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() && !isLoading && !disabled) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="flex gap-2 p-4 bg-card rounded-lg border shadow-sm">
          <Input
            type="text"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={disabled || isLoading}
            className="flex-1"
            aria-label="Text query input"
          />
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading || disabled}
            size="default"
            aria-label="Send query"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Or use voice mode for a more natural conversation
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
