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
    <aside className="h-screen bg-black/30 backdrop-blur-xl border-r border-white/5 flex flex-col w-[260px]">
      {/* Header */}
      <div className="p-5">
        <h2 className="text-sm font-medium text-white mb-3">History</h2>
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/[0.04] rounded-lg transition-colors border border-white/5 hover:border-white/10"
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
            <h3 className="text-xs font-medium text-gray-500 mb-2">
              {dateGroup}
            </h3>

            {/* Conversations in this group */}
            <div className="space-y-1">
              {convos.map((conversation) => (
                <div key={conversation.id} className="relative group">
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${
                        activeConversationId === conversation.id
                          ? "bg-purple-500/20 text-white border border-purple-500/30"
                          : "text-gray-300 hover:bg-white/[0.04] border border-transparent hover:border-white/10"
                      }
                    `}
                  >
                    <p className="truncate">{conversation.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
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
                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] rounded transition-opacity"
                  >
                    <MoreVertical className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* Delete Menu */}
                  {menuOpen === conversation.id && (
                    <div className="absolute right-2 top-10 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.5)] z-10 overflow-hidden min-w-[120px]">
                      <button
                        onClick={() => {
                          onDeleteConversation(conversation.id);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
            <p className="text-sm text-gray-500">No conversations yet</p>
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
