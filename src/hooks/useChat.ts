'use client';

import { useState, useCallback } from 'react';
import { Message, SearchRequest, SearchResponse } from '@/types';
import { API_ENDPOINTS } from '@/lib/constants';
import { toast } from 'sonner';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      isComplete: false,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const searchQuery = useCallback(
    async (query: string): Promise<SearchResponse | null> => {
      if (!query.trim()) {
        toast.error('Please provide a query');
        return null;
      }

      setIsLoading(true);

      try {
        const request: SearchRequest = {
          query: query.trim(),
          limit: 5,
        };

        const response = await fetch(API_ENDPOINTS.search, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();
        return data;
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search. Backend may be offline.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleUserQuery = useCallback(
    async (query: string) => {
      // Add user message
      const userMessageId = addMessage('user', query);
      updateMessage(userMessageId, { isComplete: true });

      // Search for answer
      const result = await searchQuery(query);

      if (result) {
        // Add assistant message with sources
        const assistantMessageId = addMessage('assistant', result.summary);
        updateMessage(assistantMessageId, {
          sources: result.sources,
          isComplete: true,
        });

        return result;
      }

      return null;
    },
    [addMessage, updateMessage, searchQuery]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    handleUserQuery,
    addMessage,
    updateMessage,
    clearMessages,
  };
}
