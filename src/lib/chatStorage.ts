/**
 * LocalStorage utilities for managing chat history
 */

import { ChatHistory, ChatStore, Message } from '@/types/chat';

const STORAGE_KEY = 'rag_chat_store';

/**
 * Load chat store from localStorage
 */
export function loadChatStore(): ChatStore {
  if (typeof window === 'undefined') {
    return { conversations: [], activeConversationId: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { conversations: [], activeConversationId: null };
    }

    const parsed = JSON.parse(stored);

    // Convert date strings back to Date objects
    parsed.conversations = parsed.conversations.map((conv: any) => ({
      ...conv,
      created_at: new Date(conv.created_at),
      updated_at: new Date(conv.updated_at),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));

    return parsed;
  } catch (error) {
    console.error('Failed to load chat store:', error);
    return { conversations: [], activeConversationId: null };
  }
}

/**
 * Save chat store to localStorage
 */
export function saveChatStore(store: ChatStore): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to save chat store:', error);
  }
}

/**
 * Create a new conversation
 */
export function createConversation(firstMessage?: string): ChatHistory {
  const now = new Date();
  return {
    id: generateId(),
    title: firstMessage || 'New Chat',
    messages: [],
    created_at: now,
    updated_at: now,
  };
}

/**
 * Add a message to a conversation
 */
export function addMessageToConversation(
  conversation: ChatHistory,
  message: Message
): ChatHistory {
  const updatedMessages = [...conversation.messages, message];

  // Update title to first user message if still default
  const title = conversation.title === 'New Chat' && message.role === 'user'
    ? truncateTitle(message.content)
    : conversation.title;

  return {
    ...conversation,
    title,
    messages: updatedMessages,
    updated_at: new Date(),
  };
}

/**
 * Update a conversation in the store
 */
export function updateConversation(
  store: ChatStore,
  conversationId: string,
  updater: (conversation: ChatHistory) => ChatHistory
): ChatStore {
  const conversations = store.conversations.map((conv) =>
    conv.id === conversationId ? updater(conv) : conv
  );

  return {
    ...store,
    conversations,
  };
}

/**
 * Delete a conversation
 */
export function deleteConversation(store: ChatStore, conversationId: string): ChatStore {
  const conversations = store.conversations.filter((conv) => conv.id !== conversationId);

  // If deleted conversation was active, clear active ID
  const activeConversationId =
    store.activeConversationId === conversationId ? null : store.activeConversationId;

  return {
    conversations,
    activeConversationId,
  };
}

/**
 * Get a conversation by ID
 */
export function getConversation(store: ChatStore, conversationId: string): ChatHistory | undefined {
  return store.conversations.find((conv) => conv.id === conversationId);
}

/**
 * Set active conversation
 */
export function setActiveConversation(store: ChatStore, conversationId: string | null): ChatStore {
  return {
    ...store,
    activeConversationId: conversationId,
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Truncate title to reasonable length
 */
function truncateTitle(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Export all conversations as JSON
 */
export function exportConversations(store: ChatStore): string {
  return JSON.stringify(store.conversations, null, 2);
}

/**
 * Clear all conversations
 */
export function clearAllConversations(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
