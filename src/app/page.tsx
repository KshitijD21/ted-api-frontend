"use client";

import { useState, useEffect } from "react";
import { useRepositories } from "@/hooks/useRepositories";
import { useVoiceMode } from "@/hooks/useVoiceMode";
import { useChat } from "@/hooks/useChat";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Github,
  Mic,
  MessageSquare,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { VideoStatusCard } from "@/components/VideoStatusCard";
import { toast } from "sonner";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [submittedRepoUrl, setSubmittedRepoUrl] = useState<string | null>(null);
  const [showVideoStatus, setShowVideoStatus] = useState(false);
  const { addRepository, isLoading, error } = useRepositories();

  const handleAddRepo = async () => {
    if (repoUrl.trim()) {
      try {
        toast.loading("Processing repository...", { id: "repo-fetch" });
        await addRepository(repoUrl);
        setSubmittedRepoUrl(repoUrl);
        setShowVideoStatus(true);
        setRepoUrl("");
        toast.success("Repository added successfully!", { id: "repo-fetch" });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to add repository",
          { id: "repo-fetch" }
        );
      }
    }
  };

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

      {/* Animated grain texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      <Toaster position="top-right" />

      {/* Floating Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30"
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-light text-white tracking-tight">
                CodeVoice
              </span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center gap-8">
              <Link
                href="/voice-rag-final"
                className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
              >
                How it works
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-8">
        <div className="max-w-5xl mx-auto w-full pt-32 pb-48">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h1 className="text-[100px] font-extralight leading-none mb-6 tracking-tight">
              <span className="text-white">Talk to Your </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                Code
              </span>
            </h1>
            <p className="text-xl text-gray-400 font-light">
              AI voice conversations with your repositories
            </p>
          </motion.div>

          {/* Hero Input - THE Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <div className="relative group">
              {/* Animated gradient border on focus */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full opacity-0 group-hover:opacity-20 group-focus-within:opacity-40 blur-2xl transition-opacity duration-500 animate-gradient-shift" />

              <div className="relative flex items-center gap-4 px-8 py-6 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 focus-within:border-purple-500/50 transition-all duration-500 group-hover:translate-y-[-4px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
                <Github className="w-6 h-6 text-gray-500 flex-shrink-0 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
                  placeholder="Paste your repository URL"
                  className="flex-1 bg-transparent text-white text-lg placeholder:text-gray-500 focus:outline-none"
                />
                <motion.button
                  onClick={handleAddRepo}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Add
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Video Status Section */}
          <AnimatePresence>
            {showVideoStatus && submittedRepoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <VideoStatusCard
                  repoUrl={submittedRepoUrl}
                  onVideoReady={(url) => {
                    console.log("Video ready:", url);
                    toast.success("🎥 Your code overview video is ready!");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Selection Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center gap-6"
          >
            <Link href="/voice-rag-final">
              <button className="group px-8 py-4 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300 group-hover:text-white transition-colors">
                    Start Voice Chat
                  </span>
                </div>
              </button>
            </Link>

            <Link href="/voice-rag-final">
              <button className="group px-8 py-4 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-pink-500/30 hover:bg-white/[0.04] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-pink-400" />
                  <span className="text-gray-300 group-hover:text-white transition-colors">
                    Try Text Mode
                  </span>
                </div>
              </button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex items-center justify-center gap-12 mt-32"
          >
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Real-time Voice</div>
              <div className="text-sm text-gray-400">Instant responses</div>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Secure RAG</div>
              <div className="text-sm text-gray-400">Private & safe</div>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">GitHub Native</div>
              <div className="text-sm text-gray-400">Works with any repo</div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <Link
              href="/voice-rag-final"
              className="hover:text-gray-400 transition-colors"
            >
              About
            </Link>
            <span className="text-gray-800">•</span>
            <a href="#" className="hover:text-gray-400 transition-colors">
              Privacy
            </a>
            <span className="text-gray-800">•</span>
            <a href="#" className="hover:text-gray-400 transition-colors">
              Docs
            </a>
            <span className="text-gray-800">•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
