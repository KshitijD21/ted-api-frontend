"use client";

import { Plus, MoreVertical, Trash2 } from "lucide-react";
import { ChatHistory } from "@/types/chat";
import { useState } from "react";

interface ChatSidebarProps {
  conversations: ChatHistory[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: ChatSidebarProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Group conversations by date
  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <aside className="h-screen bg-sidebar border-r border-border flex flex-col w-[260px]">
      {/* Header */}
      <div className="p-5">
        <h2 className="text-sm font-medium text-foreground mb-3">History</h2>
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-5 space-y-6">
        {Object.entries(groupedConversations).map(([dateGroup, convos]) => (
          <div key={dateGroup}>
            {/* Date Group Header */}
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              {dateGroup}
            </h3>

            {/* Conversations in this group */}
            <div className="space-y-1">
              {convos.map((conversation) => (
                <div key={conversation.id} className="relative group">
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                      ${
                        activeConversationId === conversation.id
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-foreground hover:bg-secondary"
                      }
                    `}
                  >
                    <p className="truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(conversation.updated_at).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </button>

                  {/* More Options */}
                  <button
                    onClick={() =>
                      setMenuOpen(
                        menuOpen === conversation.id ? null : conversation.id
                      )
                    }
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                  >
                    <MoreVertical className="w-3 h-3 text-muted-foreground" />
                  </button>

                  {/* Delete Menu */}
                  {menuOpen === conversation.id && (
                    <div className="absolute right-2 top-10 bg-white border border-border rounded-lg shadow-elevated z-10 overflow-hidden min-w-[120px]">
                      <button
                        onClick={() => {
                          onDeleteConversation(conversation.id);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No conversations yet
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

// Helper function to group conversations by date
function groupConversationsByDate(
  conversations: ChatHistory[]
): Record<string, ChatHistory[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, ChatHistory[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at);
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (dateOnly.getTime() === today.getTime()) {
      groups.Today.push(conv);
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}
