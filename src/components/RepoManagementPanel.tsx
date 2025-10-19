"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Repository } from "@/types";
import { Plus, GitBranch, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface RepoManagementPanelProps {
  repositories: Repository[];
  activeRepo: Repository | null;
  onAddRepo: (url: string) => Promise<Repository>;
  onSwitchRepo: (repoId: string) => void;
  onRemoveRepo: (repoId: string) => void;
}

export function RepoManagementPanel({
  repositories,
  activeRepo,
  onAddRepo,
  onSwitchRepo,
  onRemoveRepo,
}: RepoManagementPanelProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddRepo = async () => {
    if (!repoUrl.trim()) {
      toast.error("Please enter a repository URL");
      return;
    }

    setIsAdding(true);
    try {
      await onAddRepo(repoUrl);
      setRepoUrl("");
      toast.success("Repository added successfully");
    } catch {
      toast.error("Failed to add repository");
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusBadge = (status: Repository["status"]) => {
    const variants = {
      active: { variant: "default" as const, icon: Check, text: "Active" },
      inactive: { variant: "secondary" as const, icon: X, text: "Inactive" },
      indexing: {
        variant: "outline" as const,
        icon: Loader2,
        text: "Indexing",
      },
      error: { variant: "destructive" as const, icon: X, text: "Error" },
    };

    const { variant, icon: Icon, text } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon
          className={`h-3 w-3 ${status === "indexing" ? "animate-spin" : ""}`}
        />
        {text}
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Add Repository */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter GitHub repository URL..."
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
          disabled={isAdding}
          className="flex-1"
        />
        <Button
          onClick={handleAddRepo}
          disabled={isAdding || !repoUrl.trim()}
          size="default"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Repository List */}
      {repositories.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Repositories ({repositories.length})
          </div>
          <div className="grid gap-2">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border
                  transition-all cursor-pointer hover:shadow-md
                  ${
                    activeRepo?.id === repo.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }
                `}
                onClick={() => onSwitchRepo(repo.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{repo.name}</div>
                    {repo.lastIndexed && (
                      <div className="text-xs text-muted-foreground">
                        Last indexed: {repo.lastIndexed.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(repo.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRepo(repo.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Repository Display */}
      {activeRepo && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">Active:</span>
          <Badge variant="secondary" className="font-mono">
            {activeRepo.name}
          </Badge>
        </div>
      )}
    </div>
  );
}
