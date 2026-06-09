"use client";

import { getAmplitudeDeviceId } from "@/lib/amplitude";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, useRef, useState } from "react";
import { ChatMessage, RichContent, SendMessageResponse, SuggestedAction } from "./types";

/**
 * SSE event shapes emitted by the backend. Mirror types from
 * backend/src/ai-assistant/ai-assistant.service.ts::StreamEvent.
 */
type StreamEvent =
  | { type: "started" }
  | { type: "tool_call_start"; toolName: string }
  | {
      type: "tool_call_end";
      toolName: string;
      durationMs: number;
      hasRichContent: boolean;
    }
  | { type: "rich_content"; block: RichContent }
  | { type: "text_delta"; content: string }
  | { type: "suggested_actions"; actions: SuggestedAction[] }
  | { type: "done"; messageId: string; processingTimeMs: number }
  | { type: "error"; errorType: string; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Generate or retrieve anonymous ID for non-logged-in users
function getAnonymousId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("homi_anonymous_id");
  if (!id) {
    id = "anon_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("homi_anonymous_id", id);
  }
  return id;
}

export function useAiChat() {
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // Active streaming abort controller. Stored in a ref because we need to
  // call .abort() from outside the sendMessage closure (Stop button).
  const abortRef = useRef<AbortController | null>(null);

  // Get auth token if available
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Initialize or restore session
  const initSession = useCallback(
    async (locale: string = "en", userRole?: string) => {
      if (isInitialized) return;

      setIsLoading(true);
      setError(null);

      try {
        const anonymousId = getAnonymousId();
        // First, try to find an active session
        const findResponse = await fetch(
          `${API_URL}/ai-assistant/sessions/active?anonymousId=${encodeURIComponent(anonymousId)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
          },
        );

        if (findResponse.ok) {
          const data = await findResponse.json();
          if (data.session) {
            setSessionId(data.session.sessionId);
            // Map messages defensively (server may return either top-level fields or metadata)
            const mappedMessages = (data.session.messages || []).map(
              (msg: any) => ({
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
                richContent: msg.richContent ?? msg.metadata?.richContent,
                suggestedActions:
                  msg.suggestedActions ?? msg.metadata?.suggestedActions,
              }),
            );
            setMessages(mappedMessages);
            setIsInitialized(true);
            setIsLoading(false);
            return;
          }
        }

        // No active session, create new one
        const createResponse = await fetch(`${API_URL}/ai-assistant/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            anonymousId,
            context: {
              preferredLocale: locale,
              userRole: userRole || "guest",
            },
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create chat session");
        }

        const session = await createResponse.json();
        setSessionId(session.sessionId);
        setMessages([]);
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize chat session:", err);
        setError(t("ai.errorGenericStart"));
      } finally {
        setIsLoading(false);
      }
    },
    [getAuthHeaders, isInitialized],
  );

  /**
   * Mutate the in-flight assistant message (always the last in the array
   * once we've appended it). Centralized so each event handler is a
   * one-liner instead of a sprawling setMessages with array math.
   */
  const updateLastAssistant = useCallback(
    (patch: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)) => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== "assistant") return prev;
        const next = typeof patch === "function" ? patch(last) : patch;
        return [...prev.slice(0, -1), { ...last, ...next }];
      });
    },
    [],
  );

  /**
   * Send a message via SSE streaming. Renders tokens as they arrive,
   * tool-call chips during execution, and rich content blocks as they
   * land. Calling `stopStreaming()` from outside aborts mid-flight.
   */
  const sendMessage = useCallback(
    async (
      message: string,
      locale: string = "en",
      currentPage?: string,
      country?: string,
    ): Promise<void> => {
      if (!sessionId || !message.trim()) return;

      setIsLoading(true);
      setError(null);

      // Optimistically add user message + an empty assistant message we'll
      // mutate as events arrive.
      const userMessage: ChatMessage = {
        role: "user",
        content: message.trim(),
        createdAt: new Date().toISOString(),
      };
      const assistantPlaceholder: ChatMessage = {
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
        activeTool: null,
        finishedTools: [],
      };
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const amplitudeDeviceId = getAmplitudeDeviceId();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...getAuthHeaders(),
        };
        if (amplitudeDeviceId) {
          headers["X-Amplitude-Device-Id"] = amplitudeDeviceId;
        }

        const response = await fetch(
          `${API_URL}/ai-assistant/sessions/${sessionId}/messages/stream`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              message: message.trim(),
              locale,
              currentPage,
              country,
            }),
            signal: controller.signal,
          },
        );

        if (!response.ok || !response.body) {
          if (response.status === 429) {
            setError(t("ai.errorRateLimited"));
            updateLastAssistant({ isStreaming: false, activeTool: null });
            setMessages((prev) => prev.slice(0, -2));
            return;
          }
          throw new Error(`Stream failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Standard SSE framing: events are `data: <json>\n\n`. Parse
        // line by line out of the buffer.
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process all complete frames in the buffer.
          let sepIdx: number;
          while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sepIdx);
            buffer = buffer.slice(sepIdx + 2);
            const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            const json = dataLine.slice(6);
            let event: StreamEvent;
            try {
              event = JSON.parse(json) as StreamEvent;
            } catch {
              continue; // skip malformed frame
            }
            // ---- event dispatch ----
            switch (event.type) {
              case "started":
                // No-op; the assistant placeholder already exists.
                break;
              case "tool_call_start":
                updateLastAssistant({ activeTool: event.toolName });
                break;
              case "tool_call_end":
                updateLastAssistant((m) => ({
                  activeTool: null,
                  finishedTools: [...(m.finishedTools ?? []), event.toolName],
                }));
                break;
              case "rich_content":
                updateLastAssistant((m) => ({
                  richContent: [...(m.richContent ?? []), event.block],
                }));
                break;
              case "text_delta":
                updateLastAssistant((m) => ({
                  content: m.content + event.content,
                }));
                break;
              case "suggested_actions":
                updateLastAssistant({ suggestedActions: event.actions });
                break;
              case "done":
                updateLastAssistant({
                  isStreaming: false,
                  activeTool: null,
                });
                break;
              case "error":
                updateLastAssistant({
                  isStreaming: false,
                  activeTool: null,
                });
                setError(event.message || "Stream error");
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User pressed stop. Keep the partial message visible.
          updateLastAssistant({ isStreaming: false, activeTool: null });
        } else {
          console.error("Failed to send message:", err);
          setError(t("ai.errorGenericSend"));
          // Remove placeholder + user message on hard failure.
          setMessages((prev) => prev.slice(0, -2));
        }
      } finally {
        abortRef.current = null;
        setIsLoading(false);
      }
    },
    [sessionId, getAuthHeaders, updateLastAssistant],
  );

  /**
   * Cancel an in-flight stream. Safe to call anytime - no-op if nothing
   * is streaming. The partial response stays in the chat history.
   */
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Clear chat (close session and start new one)
  const clearChat = useCallback(
    async (locale: string = "en") => {
      if (sessionId) {
        try {
          await fetch(`${API_URL}/ai-assistant/sessions/${sessionId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
        } catch (err) {
          console.error("Failed to close session:", err);
        }
      }

      setSessionId(null);
      setMessages([]);
      setIsInitialized(false);

      // Create new session
      await initSession(locale);
    },
    [sessionId, getAuthHeaders, initSession],
  );

  return {
    sessionId,
    messages,
    isLoading,
    error,
    isInitialized,
    initSession,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
