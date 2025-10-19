"use client";

import { Button } from "@/components/ui/button";
import { VoiceState } from "@/types";
import { Mic, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceModeToggleProps {
  voiceState: VoiceState;
  onToggle: () => void;
  disabled?: boolean;
}

export function VoiceModeToggle({
  voiceState,
  onToggle,
  disabled = false,
}: VoiceModeToggleProps) {
  const isActive = voiceState !== "idle";

  const getStateConfig = () => {
    switch (voiceState) {
      case "listening":
        return {
          icon: <Mic className="h-12 w-12 text-white" />,
          gradient: "from-purple-500 to-purple-600",
          label: "Listening...",
          animation: { scale: [1, 1.1, 1] },
          animationDuration: 2,
        };
      case "thinking":
        return {
          icon: <Loader2 className="h-12 w-12 text-white" />,
          gradient: "from-orange-500 to-orange-600",
          label: "Thinking...",
          animation: { rotate: 360 },
          animationDuration: 1.5,
        };
      case "speaking":
        return {
          icon: <Volume2 className="h-12 w-12 text-white" />,
          gradient: "from-green-500 to-green-600",
          label: "Speaking...",
          animation: { scale: [1, 1.05, 1] },
          animationDuration: 0.6,
        };
      default:
        return {
          icon: <Mic className="h-12 w-12 text-white" />,
          gradient: "from-blue-500 to-blue-600",
          label: "Start Voice Chat",
          animation: {},
          animationDuration: 0,
        };
    }
  };

  const config = getStateConfig();

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      {/* Animated Background Halos - ChatGPT Style */}
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {isActive && (
            <>
              {/* Outer expanding circle */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  background: `linear-gradient(to right, ${
                    voiceState === "listening"
                      ? "rgb(168, 85, 247)"
                      : voiceState === "thinking"
                      ? "rgb(249, 115, 22)"
                      : "rgb(34, 197, 94)"
                  }, ${
                    voiceState === "listening"
                      ? "rgb(147, 51, 234)"
                      : voiceState === "thinking"
                      ? "rgb(234, 88, 12)"
                      : "rgb(22, 163, 74)"
                  })`,
                }}
                initial={{ width: 128, height: 128, opacity: 0.4 }}
                animate={{
                  width: [128, 200, 220],
                  height: [128, 200, 220],
                  opacity: [0.4, 0.1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />

              {/* Middle expanding circle */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  background: `linear-gradient(to right, ${
                    voiceState === "listening"
                      ? "rgb(168, 85, 247)"
                      : voiceState === "thinking"
                      ? "rgb(249, 115, 22)"
                      : "rgb(34, 197, 94)"
                  }, ${
                    voiceState === "listening"
                      ? "rgb(147, 51, 234)"
                      : voiceState === "thinking"
                      ? "rgb(234, 88, 12)"
                      : "rgb(22, 163, 74)"
                  })`,
                }}
                initial={{ width: 128, height: 128, opacity: 0.6 }}
                animate={{
                  width: [128, 170, 190],
                  height: [128, 170, 190],
                  opacity: [0.6, 0.2, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.3,
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Main 128px Circular Button - ChatGPT Style */}
        <motion.div
          animate={isActive ? config.animation : {}}
          transition={{
            duration: config.animationDuration,
            repeat: isActive && config.animationDuration > 0 ? Infinity : 0,
            ease: voiceState === "thinking" ? "linear" : "easeInOut",
          }}
        >
          <Button
            onClick={onToggle}
            disabled={disabled}
            size="lg"
            className={`
              relative h-32 w-32 rounded-full shadow-2xl
              bg-gradient-to-r ${config.gradient}
              hover:shadow-3xl hover:scale-105
              active:scale-95
              transition-all duration-200
              border-0
            `}
            aria-label={isActive ? "Stop voice mode" : "Start voice mode"}
          >
            <motion.div
              key={voiceState}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {config.icon}
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* State Label */}
      <motion.div
        key={voiceState}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <p className="text-lg font-medium text-foreground">{config.label}</p>
        {!isActive && (
          <p className="text-sm text-muted-foreground mt-1">
            Click the button to start
          </p>
        )}
      </motion.div>

      {/* Audio Wave Visualization for Listening State */}
      {voiceState === "listening" && (
        <div className="flex gap-1 items-end h-8">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-purple-500 rounded-full"
              animate={{
                height: ["8px", "32px", "8px"],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
