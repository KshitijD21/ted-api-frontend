"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  CheckCircle2,
  Loader2,
  Clock,
  Download,
  Play,
  ExternalLink,
} from "lucide-react";

interface VideoStatusCardProps {
  repoUrl: string;
  onVideoReady?: (url: string) => void;
}

interface VideoStatus {
  status: "pending" | "processing" | "completed" | "error" | "unknown";
  public_url?: string;
  updated_at?: string;
}

export function VideoStatusCard({
  repoUrl,
  onVideoReady,
}: VideoStatusCardProps) {
  const [videoStatus, setVideoStatus] = useState<VideoStatus>({
    status: "pending",
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Poll video status every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:8200/video-status");
        if (response.ok) {
          const data: VideoStatus = await response.json();
          console.log("📊 Video Status Update:", data);
          setVideoStatus(data);

          // If video is ready and we have a URL, notify parent and show video
          if (data.status === "completed" && data.public_url) {
            console.log("✅ Video is ready! URL:", data.public_url);
            onVideoReady?.(data.public_url);
            setShowVideo(true);
            // Stop polling once completed
            clearInterval(pollInterval);
          }
        } else {
          console.error("Failed to fetch video status:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch video status:", error);
      }
    }, 3000);

    // Initial fetch
    fetch("http://localhost:8200/video-status")
      .then((res) => res.json())
      .then((data) => {
        console.log("📊 Initial Video Status:", data);
        setVideoStatus(data);
        if (data.status === "completed" && data.public_url) {
          setShowVideo(true);
        }
      })
      .catch((err) => console.error("Initial status fetch failed:", err));

    return () => clearInterval(pollInterval);
  }, [onVideoReady]);

  const getStatusConfig = () => {
    switch (videoStatus.status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-400",
          bgColor: "bg-yellow-400/10",
          borderColor: "border-yellow-400/20",
          title: "Initializing",
          description: "Preparing to process your repository...",
        };
      case "processing":
        return {
          icon: Loader2,
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
          borderColor: "border-blue-400/20",
          title: "Processing",
          description: "Generating video presentation from your code...",
          animate: true,
        };
      case "completed":
        return {
          icon: CheckCircle2,
          color: "text-green-400",
          bgColor: "bg-green-400/10",
          borderColor: "border-green-400/20",
          title: "Video Ready",
          description: "Your code overview video is ready!",
        };
      case "error":
        return {
          icon: Video,
          color: "text-red-400",
          bgColor: "bg-red-400/10",
          borderColor: "border-red-400/20",
          title: "Error",
          description: "Failed to generate video. Please try again.",
        };
      default:
        return {
          icon: Video,
          color: "text-gray-400",
          bgColor: "bg-gray-400/10",
          borderColor: "border-gray-400/20",
          title: "Unknown Status",
          description: "Checking video generation status...",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div
        className={`relative rounded-2xl border ${config.borderColor} ${config.bgColor} backdrop-blur-xl overflow-hidden`}
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 animate-gradient-shift" />
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}
              >
                {config.animate ? (
                  <Icon className={`w-5 h-5 ${config.color} animate-spin`} />
                ) : (
                  <Icon className={`w-5 h-5 ${config.color}`} />
                )}
              </div>
              <div>
                <h3 className={`text-sm font-medium ${config.color}`}>
                  {config.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {config.description}
                </p>
              </div>
            </div>

            {videoStatus.updated_at && (
              <span className="text-xs text-gray-600">
                {new Date(videoStatus.updated_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Loading Animation */}
          {(videoStatus.status === "pending" ||
            videoStatus.status === "processing") && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Loader2 className="w-3 h-3" />
                </motion.div>
                <span>
                  {videoStatus.status === "pending"
                    ? "Analyzing repository..."
                    : "Creating slides and narration..."}
                </span>
              </div>
            </div>
          )}

          {/* Video Player */}
          <AnimatePresence>
            {videoStatus.status === "completed" && videoStatus.public_url && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-4 space-y-3"
              >
                {/* Video Container */}
                {showVideo && (
                  <div className="relative rounded-xl overflow-hidden bg-black/50 border border-white/10">
                    <video
                      controls
                      className="w-full aspect-video"
                      crossOrigin="anonymous"
                      playsInline
                      preload="metadata"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={(e) => {
                        console.error("Video error:", e);
                        console.error("Video URL:", videoStatus.public_url);
                      }}
                      onLoadedMetadata={() => {
                        console.log("✅ Video loaded successfully");
                      }}
                    >
                      <source src={videoStatus.public_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Play Overlay */}
                    {!isPlaying && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-pointer"
                        onClick={(e) => {
                          const video = e.currentTarget
                            .previousElementSibling as HTMLVideoElement;
                          if (video) {
                            video.play();
                          }
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                        >
                          <Play className="w-8 h-8 text-white" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={videoStatus.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white group"
                    >
                      <ExternalLink className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                      Open in New Tab
                    </a>
                    <a
                      href={videoStatus.public_url}
                      download="code-overview.mp4"
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 flex items-center gap-2 text-sm text-white font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>

                  {/* Debug Info */}
                  <div className="text-xs text-gray-600 font-mono">
                    <details className="cursor-pointer">
                      <summary className="hover:text-gray-400 transition-colors">
                        Debug Info
                      </summary>
                      <div className="mt-2 space-y-1 pl-2">
                        <div>Status: {videoStatus.status}</div>
                        <div>
                          URL: {videoStatus.public_url || "Not available"}
                        </div>
                        <div>Updated: {videoStatus.updated_at || "N/A"}</div>
                      </div>
                    </details>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Repository Info */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-600">
              Repository:{" "}
              <span className="text-gray-400 font-mono">{repoUrl}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
