"use client";

import { motion, AnimatePresence } from "framer-motion";
import { COLORS } from "@/lib/constants";

interface LiveTranscriptProps {
  text: string;
  isActive: boolean;
}

export function LiveTranscript({ text, isActive }: LiveTranscriptProps) {
  if (!isActive || !text) return null;

  // Split text into words for word-by-word animation
  const words = text.split(" ");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative max-w-2xl mx-auto"
      >
        {/* Animated halo/glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl blur-xl"
          style={{
            backgroundColor: COLORS.user.primary,
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Chat bubble */}
        <div
          className="relative p-6 rounded-2xl shadow-lg border"
          style={{
            backgroundColor: COLORS.user.bg,
            borderColor: COLORS.user.light,
          }}
        >
          {/* Pulse indicator */}
          <div className="absolute -top-2 -right-2 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS.user.primary }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Transcript text with word-by-word animation */}
          <div className="text-lg leading-relaxed">
            <AnimatePresence mode="popLayout">
              {words.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                  className="inline-block mr-1"
                  style={{ color: COLORS.user.dark }}
                >
                  {word}
                </motion.span>
              ))}
            </AnimatePresence>

            {/* Blinking cursor */}
            <motion.span
              className="inline-block w-0.5 h-5 ml-1 align-middle"
              style={{ backgroundColor: COLORS.user.primary }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Label */}
          <div className="mt-3 text-xs font-medium opacity-60">
            You&apos;re saying...
          </div>
        </div>

        {/* Decorative wave lines */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full"
              style={{ backgroundColor: COLORS.user.primary }}
              animate={{
                height: ["4px", "16px", "4px"],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
