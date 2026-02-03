'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatSession, SendMessageResponse, SuggestedAction } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Generate or retrieve anonymous ID for non-logged-in users
function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';

  let id = localStorage.getItem('homi_anonymous_id');
  if (!id) {
    id = 'anon_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('homi_anonymous_id', id);
  }
  return id;
}

export function useAiChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get auth token if available
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Initialize or restore session
  const initSession = useCallback(async (locale: string = 'en', userRole?: string) => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      // First, try to find an active session
      const findResponse = await fetch(`${API_URL}/ai-assistant/sessions/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (findResponse.ok) {
        const data = await findResponse.json();
        if (data.session) {
          setSessionId(data.session.sessionId);
          setMessages(data.session.messages || []);
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }
      }

      // No active session, create new one
      const createResponse = await fetch(`${API_URL}/ai-assistant/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          anonymousId: getAnonymousId(),
          context: {
            preferredLocale: locale,
            userRole: userRole || 'guest',
          },
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create chat session');
      }

      const session = await createResponse.json();
      setSessionId(session.sessionId);
      setMessages([]);
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize chat session:', err);
      setError('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, isInitialized]);

  // Send a message
  const sendMessage = useCallback(async (
    message: string,
    locale: string = 'en',
    currentPage?: string
  ): Promise<void> => {
    if (!sessionId || !message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Optimistically add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_URL}/ai-assistant/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: message.trim(),
          locale,
          currentPage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: SendMessageResponse = await response.json();

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        createdAt: new Date().toISOString(),
        suggestedActions: data.suggestedActions,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      // Remove optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, getAuthHeaders]);

  // Clear chat (close session and start new one)
  const clearChat = useCallback(async (locale: string = 'en') => {
    if (sessionId) {
      try {
        await fetch(`${API_URL}/ai-assistant/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
      } catch (err) {
        console.error('Failed to close session:', err);
      }
    }

    setSessionId(null);
    setMessages([]);
    setIsInitialized(false);

    // Create new session
    await initSession(locale);
  }, [sessionId, getAuthHeaders, initSession]);

  return {
    sessionId,
    messages,
    isLoading,
    error,
    isInitialized,
    initSession,
    sendMessage,
    clearChat,
  };
}
