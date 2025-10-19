"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface SetupStepProps {
  title: string;
  description: string;
  isComplete: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function SetupStep({ title, description, isComplete, action }: SetupStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 p-4 rounded-lg border bg-card"
    >
      <div className="flex-shrink-0 mt-1">
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
        {action && (
          <Button size="sm" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

interface SetupGuideProps {
  hasRepo: boolean;
  hasMicPermission: boolean;
  isWebSocketConnected: boolean;
}

export function SetupGuide({
  hasRepo,
  hasMicPermission,
  isWebSocketConnected,
}: SetupGuideProps) {
  const allComplete = hasRepo && hasMicPermission && isWebSocketConnected;

  if (allComplete) {
    return null; // Don't show guide when everything is set up
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <AlertCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Getting Started</h2>
          <p className="text-sm text-muted-foreground">
            Complete these steps to use the voice assistant
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <SetupStep
          title="Add a Repository"
          description="Enter a GitHub repository URL to enable code search"
          isComplete={hasRepo}
        />

        <SetupStep
          title="Grant Microphone Access"
          description="Allow microphone permission to use voice features"
          isComplete={hasMicPermission}
        />

        <SetupStep
          title="WebSocket Connection"
          description="Ensure your Gemini WebSocket endpoint is configured and running"
          isComplete={isWebSocketConnected}
          action={{
            label: "View Documentation",
            onClick: () => window.open("https://github.com", "_blank"),
          }}
        />
      </div>

      {!isWebSocketConnected && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Note:</strong> Update{" "}
            <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-xs">
              NEXT_PUBLIC_GEMINI_WS_URL
            </code>{" "}
            in your{" "}
            <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-xs">
              .env.local
            </code>{" "}
            file
          </p>
        </div>
      )}
    </Card>
  );
}
