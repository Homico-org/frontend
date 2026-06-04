"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMarketplaceCountry } from "@/hooks/useCountry";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Square, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import RichContentRenderer from "./RichContentRenderer";
import { ChatMessage, SuggestedAction } from "./types";
import { useAiChat } from "./useAiChat";

// Render assistant text with two affordances:
//   - Markdown links `[label](url)` become real <a> tags. The system prompt
//     tells the model not to use them, but older messages in history may
//     still contain them and we'd rather render them than show raw brackets.
//   - Bare URLs (http://... / https://...) also become links.
// Returns a flat array of strings + JSX nodes that callers drop inside a
// whitespace-pre-wrap container so newlines/lists keep their layout.
function renderMessageText(text: string): React.ReactNode[] {
  if (!text) return [text];
  // Combined regex: markdown link OR bare URL. Capture groups let us
  // distinguish which kind matched without re-parsing.
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, mdLabel, mdUrl, bareUrl] = match;
    const href = mdUrl || bareUrl;
    const label = mdLabel || bareUrl;
    nodes.push(
      <a
        key={`lnk-${key++}`}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="underline text-[var(--hm-brand-500)] hover:opacity-80 break-words"
      >
        {label}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// Message bubble component
function MessageBubble({
  message,
  locale,
  onAction,
  t,
}: {
  message: ChatMessage;
  locale: string;
  onAction: (action: SuggestedAction) => void;
  t: (key: string) => string;
}): React.ReactElement {
  const isUser = message.role === "user";
  const showStreamingDot = !isUser && message.isStreaming && !message.activeTool;
  const showToolChip = !isUser && message.activeTool;

  const hasSuggestedActions =
    !isUser &&
    !!message.suggestedActions &&
    message.suggestedActions.length > 0;

  return (
    // Column wrapper so the bubble and the suggested-action chips can sit
    // on separate rows but share the same left-aligned 85%-width column.
    // Previously the chips lived inside the bubble with `w-full`, which
    // pushed the bubble past its own max-width and bled past its border.
    <div
      className={`flex flex-col mb-3 ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-[var(--hm-brand-500)] text-white rounded-br-md"
            : "rounded-bl-md shadow-sm"
        }`}
        style={
          !isUser
            ? {
                backgroundColor: "var(--hm-bg-elevated)",
                border: "1px solid var(--hm-border-subtle)",
                color: "var(--hm-fg-primary)",
              }
            : undefined
        }
      >
        {/* Tool-call status chip - shown while the model is executing a
            tool. Replaces the empty text with a localized "Searching X..."
            label so the user sees that work is happening. */}
        {showToolChip && (
          <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full mb-1.5 bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--hm-brand-500)]" />
            {t(`ai.toolStatus.${message.activeTool}`) ||
              t("ai.toolStatus.default")}
          </div>
        )}

        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {isUser ? message.content : renderMessageText(message.content)}
          {/* Blinking cursor while streaming text but no active tool. */}
          {showStreamingDot && (
            <span
              className="inline-block w-1.5 h-3.5 ml-0.5 -mb-0.5 align-baseline animate-pulse"
              style={{ backgroundColor: "var(--hm-brand-500)" }}
            />
          )}
        </p>

        {/* Rich Content */}
        {!isUser && message.richContent && message.richContent.length > 0 && (
          <div className="mt-2">
            {message.richContent.map((content, idx) => (
              <RichContentRenderer
                key={idx}
                content={content}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      {/* Suggested actions as a SIBLING of the bubble (not a child). Each
          chip is full-width inside an 85%-capped column that mirrors the
          bubble alignment. Long Georgian labels wrap inside the chip and
          the chip can never push the bubble's own max-width. */}
      {hasSuggestedActions && (
        <div className="flex flex-col gap-2 mt-2 max-w-[85%] w-[85%]">
          {message.suggestedActions!.map((action, idx) => (
            <SuggestedActionButton
              key={idx}
              action={action}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Suggested action button
function SuggestedActionButton({
  action,
  onAction,
}: {
  action: SuggestedAction;
  onAction: (action: SuggestedAction) => void;
}): React.ReactElement {
  const { pick } = useLanguage();
  const label = pick({ en: action.label, ka: action.labelKa, ru: action.labelRu });

  // Block-level chip that wraps. Crucial bits:
  //   - `flex` (not inline-flex) so the chip claims the full row in the
  //     parent column container.
  //   - `w-full min-w-0` so it can shrink narrower than its label and let
  //     `whitespace-normal` + `break-words` actually wrap inside.
  //   - `justify-between` so the optional arrow stays glued to the right
  //     while the label takes the remaining space.
  // Old behavior overflowed the bubble because `inline-flex` items size
  // to content first and `max-w-full` was effectively ignored.
  const baseChip =
    "flex w-full min-w-0 items-center gap-2 justify-between whitespace-normal text-left text-[12px] leading-tight font-medium px-3 py-2 rounded-xl transition-all active:scale-[0.98]";

  if (action.type === "link" && action.url) {
    return (
      <Link
        href={action.url}
        className={`${baseChip} bg-[var(--hm-brand-500)] text-white hover:bg-[var(--hm-brand-600)]`}
      >
        <span className="min-w-0 break-words">{label}</span>
        <span aria-hidden className="shrink-0">→</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className={`${baseChip} border bg-[var(--hm-bg-elevated)] border-[var(--hm-border-strong)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]`}
    >
      <span className="min-w-0 break-words">{label}</span>
    </button>
  );
}

// Typing indicator
function TypingIndicator(): React.ReactElement {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
        style={{
          backgroundColor: "var(--hm-bg-elevated)",
          border: "1px solid var(--hm-border-subtle)",
        }}
      >
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: "var(--hm-fg-muted)",
              animationDelay: "0ms",
            }}
          />
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: "var(--hm-fg-muted)",
              animationDelay: "150ms",
            }}
          />
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: "var(--hm-fg-muted)",
              animationDelay: "300ms",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AiChatWidget(): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  // No attention-grabbing pulse on load - FAB stays quiet until the user taps it.
  const [showPulse, setShowPulse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobileRef = useRef<boolean>(false);

  const { locale, t, pick } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const pathname = usePathname();
  const country = useMarketplaceCountry();

  const {
    messages,
    isLoading,
    error,
    isInitialized,
    initSession,
    sendMessage,
    stopStreaming,
    clearChat,
  } = useAiChat();

  // Derived: is the in-flight assistant message still streaming? Used to
  // toggle send button -> stop button.
  const lastMessage = messages[messages.length - 1];
  const isStreaming = Boolean(
    lastMessage?.role === "assistant" && lastMessage?.isStreaming,
  );

  // Initialize session when widget is opened
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const userRole = user?.role || "guest";
      initSession(locale, userRole);
    }
  }, [isOpen, isInitialized, locale, user?.role, initSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Stop pulse animation after first open
  useEffect(() => {
    if (isOpen) {
      setShowPulse(false);
    }
  }, [isOpen]);

  // Track mobile breakpoint (Tailwind `sm` is 640px)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => {
      isMobileRef.current = mql.matches;
    };

    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    // Safari fallback (addListener/removeListener are deprecated but needed for older Safari)
    mql.addListener?.(update);
    return () => {
      mql.removeListener?.(update);
    };
  }, []);

  // On mobile, close chat when route changes
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (isOpen && isMobileRef.current) {
        setIsOpen(false);
      }
    }
  }, [pathname, isOpen]);

  const handleChatClickCapture = useCallback(
    (e: React.MouseEvent) => {
      if (!isMobileRef.current) return;
      if (!isOpen) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      // Let normal navigation proceed, but collapse widget immediately
      setIsOpen(false);
    },
    [isOpen],
  );

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue("");
    await sendMessage(message, locale, pathname, country);
  }, [inputValue, isLoading, sendMessage, locale, pathname, country]);

  const handleSuggestedAction = useCallback(
    async (action: SuggestedAction) => {
      if (action.type === "action") {
        const localizedAction = pick({ en: action.action, ka: action.actionKa, ru: action.actionRu });

        const text = localizedAction || action.action || action.label;
        if (!text?.trim()) return;
        await sendMessage(text, locale, pathname, country);
      }
    },
    // `pick` is intentionally not in the deps - it's a stable function
    // from useLanguage that returns the same reference unless `locale`
    // changes, and `locale` is already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendMessage, locale, pathname, country],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChat(locale);
  };

  // Quick prompts for empty state
  const quickPrompts = {
    en: ["Who is the best plumber?", "How do I register as a professional?"],
    ka: [
      "ვინ არის საუკეთესო სანტექნიკოსი?",
      "როგორ დავრეგისტრირდე პროფესიონალად?",
    ],
    ru: ["Кто лучший сантехник?", "Как зарегистрироваться как специалист?"],
  };

  const currentPrompts =
    quickPrompts[locale as keyof typeof quickPrompts] || quickPrompts.en;

  // Hide on admin and invite pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/invite"))
    return null;

  return (
    <>
      {/* Pinned bottom-right FAB. Mobile uses safe-area + bottom-nav offset so
          it never collides with MobileBottomNav (58px) or the iOS home bar. */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="ai-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-[51] group right-4 lg:right-6 bottom-[calc(80px+env(safe-area-inset-bottom)+20px)] lg:bottom-6"
            aria-label="Open AI Assistant"
          >
            {/* Outer ring - subtle hover glow */}
            <div className="absolute -inset-1 rounded-full transition-all duration-300 bg-transparent group-hover:bg-[var(--hm-brand-500)]/10 group-hover:scale-105" />

            {/* Brand vermillion circle with bot icon */}
            <div
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 ring-2 ring-[var(--hm-bg-elevated)] shadow-lg group-hover:ring-[var(--hm-brand-500)]/60 group-hover:shadow-xl"
              style={{ backgroundColor: "var(--hm-brand-500)" }}
            >
              <Bot
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                strokeWidth={2}
              />
            </div>

            {/* Tooltip */}
            <div className="hidden sm:block absolute bottom-full mb-2 right-0 px-3 py-1.5 bg-[var(--hm-n-900)] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              <span style={{ fontFamily: "var(--hm-font-display)" }}>
                Homico AI
              </span>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--hm-n-900)]" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel - fullscreen on mobile, positioned panel on desktop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - click outside to close (desktop only) */}
            <motion.div
              key="ai-chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[49] hidden sm:block"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              key="ai-chat-panel"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClickCapture={handleChatClickCapture}
              className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[400px] sm:max-w-[calc(100vw-48px)] sm:h-[650px] sm:max-h-[calc(100vh-120px)] sm:rounded-2xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden sm:border"
              style={{
                backgroundColor: "var(--hm-bg-page)",
                borderColor: "var(--hm-border-subtle)",
              }}
            >
              {/* Header */}
              <div
                className="px-4 py-3.5 flex items-center justify-between relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-700) 100%)',
                  borderBottom: '1px solid var(--hm-brand-700)',
                }}
              >
                {/* Architectural decorative line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-white/30 shadow-md flex-shrink-0 bg-white/20">
                    <Bot className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2
                      className="text-white font-semibold text-[15px] tracking-tight leading-none"
                      style={{ fontFamily: 'var(--hm-font-display)' }}
                    >
                      Homico AI
                    </h2>
                    <p className="text-white/75 text-[11px] mt-1 leading-none">
                      {t("ai.smartAssistant")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10"
                    title={t("ai.clearChat")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10"
                    title={t("ai.minimize")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-2 ring-[var(--hm-brand-500)]/15 shadow-md"
                      style={{ backgroundColor: 'var(--hm-brand-500)' }}
                    >
                      <Bot className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <h3
                      className="text-lg font-semibold mb-1.5 tracking-tight"
                      style={{ color: "var(--hm-fg-primary)", fontFamily: 'var(--hm-font-display)' }}
                    >
                      {t("ai.greeting")}
                    </h3>
                    <p
                      className="text-sm mb-5 max-w-[260px]"
                      style={{ color: "var(--hm-fg-secondary)" }}
                    >
                      {t("ai.loginPrompt")}
                    </p>
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        openLoginModal();
                      }}
                    >
                      {t("auth.login")}
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <>
                    {/* Quick prompts */}
                    <div className="pt-4">
                      <p
                        className="text-xs text-center mb-2"
                        style={{ color: "var(--hm-fg-muted)" }}
                      >
                        {t("ai.tryAsking")}
                      </p>
                      <div className="space-y-2">
                        {currentPrompts.map((prompt, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left font-normal"
                            onClick={() => {
                              setInputValue(prompt);
                              inputRef.current?.focus();
                            }}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  messages.map((message, idx) => (
                    <MessageBubble
                      key={idx}
                      message={message}
                      locale={locale}
                      onAction={handleSuggestedAction}
                      t={t}
                    />
                  ))
                )}

                {/* Show the typing indicator only when we're loading AND
                    the streaming assistant message hasn't appeared yet.
                    Once tokens start arriving, the message bubble's own
                    streaming dot is sufficient. */}
                {isLoading && !isStreaming && <TypingIndicator />}

                {error && (
                  <div className="text-center py-2">
                    <p className="text-sm text-[var(--hm-error-500)]">{error}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div
                className={`p-4 ${!isAuthenticated ? "opacity-50 pointer-events-none" : ""}`}
                style={{
                  borderTop: "1px solid var(--hm-border-subtle)",
                  backgroundColor: "var(--hm-bg-elevated)",
                }}
              >
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 min-w-0">
                    <Input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={!isAuthenticated ? t("ai.loginToChat") : t("ai.askQuestion")}
                      disabled={isLoading || !isAuthenticated}
                      className="w-full"
                    />
                  </div>
                  {isStreaming ? (
                    <Button
                      onClick={stopStreaming}
                      size="icon"
                      variant="destructive"
                      className="flex-shrink-0 h-10 w-10"
                      aria-label={t("ai.stop") || "Stop"}
                    >
                      <Square className="w-3.5 h-3.5" fill="currentColor" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSend}
                      disabled={
                        !inputValue.trim() || isLoading || !isAuthenticated
                      }
                      size="icon"
                      className="flex-shrink-0 h-10 w-10"
                      aria-label={t("ai.send") || "Send"}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p
                  className="text-[10px] text-center mt-2"
                  style={{ color: "var(--hm-fg-muted)" }}
                >
                  {t("ai.disclaimer")}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
