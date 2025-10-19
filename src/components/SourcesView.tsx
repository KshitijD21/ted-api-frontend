"use client";

import { Source } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCode, Github, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { COLORS } from "@/lib/constants";

interface SourcesViewProps {
  sources: Source[];
}

export function SourcesView({ sources }: SourcesViewProps) {
  if (sources.length === 0) return null;

  return (
    <div className="space-y-2">
      {sources.map((source, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <Card className="p-3 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: COLORS.ai.bg }}
              >
                <FileCode
                  className="h-4 w-4"
                  style={{ color: COLORS.ai.primary }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* File name and badges */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-sm font-medium truncate">
                    {source.file}
                  </span>
                  {source.repo && (
                    <Badge variant="secondary" className="text-xs">
                      <Github className="h-3 w-3 mr-1" />
                      {source.repo}
                    </Badge>
                  )}
                </div>

                {/* Snippet */}
                {source.snippet && (
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                    <code className="text-muted-foreground">
                      {source.snippet}
                    </code>
                  </pre>
                )}

                {/* External link */}
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs mt-2 hover:underline"
                    style={{ color: COLORS.ai.primary }}
                  >
                    View on GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
