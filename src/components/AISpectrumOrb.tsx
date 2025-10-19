"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface AISpectrumOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  isActive: boolean;
  audioLevel?: number;
}

export function AISpectrumOrb({
  isListening,
  isSpeaking,
  isActive,
  audioLevel = 0,
}: AISpectrumOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 80;

    const animate = () => {
      timeRef.current += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Determine orb behavior based on state
      let radiusMultiplier = 1;
      let speedMultiplier = 1;
      let colorIntensity = 0.3;
      let numberOfWaves = 8;

      if (isSpeaking) {
        radiusMultiplier = 1.3;
        speedMultiplier = 2;
        colorIntensity = 0.8;
        numberOfWaves = 12;
      } else if (isListening) {
        radiusMultiplier = 1.1 + audioLevel * 0.3;
        speedMultiplier = 1.5;
        colorIntensity = 0.6;
        numberOfWaves = 10;
      } else if (isActive) {
        radiusMultiplier = 0.9;
        speedMultiplier = 0.8;
        colorIntensity = 0.4;
        numberOfWaves = 6;
      } else {
        radiusMultiplier = 0.7;
        speedMultiplier = 0.5;
        colorIntensity = 0.2;
        numberOfWaves = 4;
      }

      // Draw multiple wave layers for depth
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();

        for (let i = 0; i <= 360; i += 2) {
          const angle = (i * Math.PI) / 180;
          const wave1 = Math.sin(
            angle * numberOfWaves + timeRef.current * speedMultiplier
          );
          const wave2 = Math.cos(
            angle * (numberOfWaves / 2) -
              timeRef.current * speedMultiplier * 0.7
          );
          const wave3 = Math.sin(
            angle * (numberOfWaves / 3) +
              timeRef.current * speedMultiplier * 0.5
          );

          const waveOffset =
            (wave1 + wave2 * 0.5 + wave3 * 0.3) * 15 * radiusMultiplier;
          const radius = baseRadius + waveOffset - layer * 10;

          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();

        // Color gradient based on state
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          baseRadius * radiusMultiplier
        );

        if (isSpeaking) {
          gradient.addColorStop(0, `rgba(139, 92, 246, ${colorIntensity})`); // Purple
          gradient.addColorStop(
            0.5,
            `rgba(236, 72, 153, ${colorIntensity * 0.8})`
          ); // Pink
          gradient.addColorStop(
            1,
            `rgba(59, 130, 246, ${colorIntensity * 0.3})`
          ); // Blue
        } else if (isListening) {
          gradient.addColorStop(0, `rgba(56, 189, 248, ${colorIntensity})`); // Cyan
          gradient.addColorStop(
            0.5,
            `rgba(139, 92, 246, ${colorIntensity * 0.8})`
          ); // Purple
          gradient.addColorStop(
            1,
            `rgba(16, 185, 129, ${colorIntensity * 0.3})`
          ); // Green
        } else {
          gradient.addColorStop(0, `rgba(168, 85, 247, ${colorIntensity})`); // Purple
          gradient.addColorStop(
            0.5,
            `rgba(236, 72, 153, ${colorIntensity * 0.6})`
          ); // Pink
          gradient.addColorStop(
            1,
            `rgba(139, 92, 246, ${colorIntensity * 0.2})`
          ); // Purple
        }

        ctx.fillStyle = gradient;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 40 * colorIntensity;
        ctx.shadowColor = isSpeaking
          ? "rgba(236, 72, 153, 0.6)"
          : isListening
          ? "rgba(56, 189, 248, 0.6)"
          : "rgba(168, 85, 247, 0.4)";
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, isSpeaking, isActive, audioLevel]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full blur-3xl opacity-40 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 animate-pulse" />

      {/* Canvas for spectrum animation */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="relative z-10"
      />

      {/* Center pulse indicator */}
      {isActive && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: isSpeaking
              ? "radial-gradient(circle, rgba(236, 72, 153, 1) 0%, rgba(236, 72, 153, 0) 70%)"
              : isListening
              ? "radial-gradient(circle, rgba(56, 189, 248, 1) 0%, rgba(56, 189, 248, 0) 70%)"
              : "radial-gradient(circle, rgba(168, 85, 247, 1) 0%, rgba(168, 85, 247, 0) 70%)",
          }}
        />
      )}
    </motion.div>
  );
}
