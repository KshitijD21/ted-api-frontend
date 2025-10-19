"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Source } from "@/types/chat";

interface SourcesSectionProps {
  sources: Source[];
}

export function SourcesSection({ sources }: SourcesSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = async (snippet: string, index: number) => {
    await navigator.clipboard.writeText(snippet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-2 mt-3">
      {sources.map((source, index) => (
        <div
          key={index}
          className="border border-border rounded-lg overflow-hidden bg-white"
        >
          {/* Source Header */}
          <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {source.file_path}
              </p>
              <p className="text-xs text-muted-foreground">{source.repo}</p>
            </div>
            {source.source_url && (
              <a
                href={source.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="View on GitHub"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Code Snippet */}
          <div className="relative">
            <pre className="p-3 overflow-x-auto text-xs leading-relaxed text-foreground bg-muted/30">
              <code>{source.snippet}</code>
            </pre>

            {/* Copy Button */}
            <button
              onClick={() => handleCopyCode(source.snippet, index)}
              className="absolute top-2 right-2 p-1.5 bg-white hover:bg-muted border border-border rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Copy code"
            >
              {copiedIndex === index ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
