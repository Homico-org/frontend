"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Minimize2, Send, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import RichContentRenderer from "./RichContentRenderer";
import { ChatMessage, SuggestedAction } from "./types";
import { useAiChat } from "./useAiChat";

// Message bubble component
function MessageBubble({
  message,
  locale,
  onAction,
}: {
  message: ChatMessage;
  locale: string;
  onAction: (action: SuggestedAction) => void;
}): React.ReactElement {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
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
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
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

        {/* Suggested Actions */}
        {!isUser &&
          message.suggestedActions &&
          message.suggestedActions.length > 0 && (
            <div
              className="flex flex-wrap gap-2 mt-3 pt-2"
              style={{ borderTop: "1px solid var(--hm-border-subtle)" }}
            >
              {message.suggestedActions.map((action, idx) => (
                <SuggestedActionButton
                  key={idx}
                  action={action}
                  onAction={onAction}
                />
              ))}
            </div>
          )}
      </div>
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

  if (action.type === "link" && action.url) {
    return (
      <Link href={action.url}>
        <Badge variant="accent-solid" size="sm">
          {label} →
        </Badge>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => onAction(action)}
      className="rounded-full text-xs"
    >
      {label}
    </Button>
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
  const [isHidden, setIsHidden] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobileRef = useRef<boolean>(false);

  // Draggable FAB state
  const [fabPosition, setFabPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fabSide, setFabSide] = useState<"right" | "left">("right");
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    moved: boolean;
  } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Initialize FAB position
  useEffect(() => {
    if (fabPosition === null && typeof window !== "undefined") {
      const isMobile = window.innerWidth < 1024;
      const bottomOffset = isMobile ? 240 : 160; // extra space on mobile for bottom nav
      setFabPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - bottomOffset,
      });
    }
  }, [fabPosition]);

  // Snap to nearest side
  const snapToSide = useCallback((x: number, y: number) => {
    const midX = window.innerWidth / 2;
    const fabSize = 64;
    const margin = 16;
    const isMobile = window.innerWidth < 1024;
    const bottomNavHeight = isMobile ? 80 : 0; // account for mobile bottom nav
    const maxY = window.innerHeight - fabSize - margin - bottomNavHeight;
    const minY = margin + 56; // below header

    const clampedY = Math.max(minY, Math.min(maxY, y));

    if (x + fabSize / 2 < midX) {
      setFabSide("left");
      return { x: margin, y: clampedY };
    } else {
      setFabSide("right");
      return { x: window.innerWidth - fabSize - margin, y: clampedY };
    }
  }, []);

  // Touch/mouse drag handlers
  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!fabPosition) return;
      dragRef.current = {
        startX: clientX,
        startY: clientY,
        startPosX: fabPosition.x,
        startPosY: fabPosition.y,
        moved: false,
      };
      setIsDragging(true);
    },
    [fabPosition],
  );

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.moved = true;
    }
    setFabPosition({
      x: dragRef.current.startPosX + dx,
      y: dragRef.current.startPosY + dy,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    const didDrag = !!dragRef.current?.moved;
    if (fabPosition) {
      const snapped = snapToSide(fabPosition.x, fabPosition.y);
      setFabPosition(snapped);
    }
    setIsDragging(false);
    dragRef.current = null;
    // Open chat only if it was a tap, not a drag
    if (!didDrag) {
      setIsOpen(true);
    }
  }, [fabPosition, snapToSide]);

  // Mouse events
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      handleDragEnd();
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0])
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      handleDragEnd();
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Re-snap on window resize
  useEffect(() => {
    const onResize = () => {
      if (fabPosition) {
        const snapped = snapToSide(fabPosition.x, fabPosition.y);
        setFabPosition(snapped);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fabPosition, snapToSide]);

  const { locale, t, pick } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const pathname = usePathname();

  const {
    messages,
    isLoading,
    error,
    isInitialized,
    initSession,
    sendMessage,
    clearChat,
  } = useAiChat();

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
    await sendMessage(message, locale, pathname);
  }, [inputValue, isLoading, sendMessage, locale, pathname]);

  const handleSuggestedAction = useCallback(
    async (action: SuggestedAction) => {
      if (action.type === "action") {
        const localizedAction = pick({ en: action.action, ka: action.actionKa, ru: action.actionRu });

        const text = localizedAction || action.action || action.label;
        if (!text?.trim()) return;
        await sendMessage(text, locale, pathname);
      }
    },
    [sendMessage, locale, pathname],
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
      {/* Right-edge reveal tab — visible only when widget is hidden */}
      <AnimatePresence>
        {isHidden && (
          <motion.button
            key="ai-reveal-tab"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => setIsHidden(false)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1 pl-2 pr-1 py-3 bg-[var(--hm-brand-500)] text-white rounded-l-xl shadow-lg hover:pr-2 hover:shadow-xl transition-all group"
            aria-label="Show AI Assistant"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/AI-mascot.png"
                alt="AI"
                width={28}
                height={28}
                className="w-full h-full object-cover scale-[1.15]"
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Draggable Button */}
      <AnimatePresence>
        {fabPosition && !isOpen && !isHidden && (
          <motion.button
            ref={fabRef}
            key="ai-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleDragStart(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              if (e.touches[0])
                handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
            }}
            className="fixed z-40 group touch-none"
            style={{
              left: fabPosition.x,
              top: fabPosition.y,
              transition: isDragging
                ? "none"
                : "left 0.35s cubic-bezier(0.32, 0.72, 0, 1), top 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
              cursor: isDragging ? "grabbing" : "grab",
            }}
            aria-label="Open AI Assistant"
          >
            {/* Outer ring — subtle glow, not flashing */}
            <div
              className={`absolute -inset-1 rounded-full transition-all duration-300 ${
                isDragging
                  ? "bg-[var(--hm-brand-500)]/20 scale-110"
                  : "bg-transparent group-hover:bg-[var(--hm-brand-500)]/10 group-hover:scale-105"
              }`}
            />

            {/* Mascot avatar */}
            <div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                isDragging
                  ? "border-[var(--hm-brand-500)] shadow-xl shadow-[var(--hm-brand-500)]/30 scale-110"
                  : "border-white shadow-lg group-hover:border-[var(--hm-brand-500)]/50 group-hover:shadow-xl"
              }`}
            >
              <Image
                src="/AI-mascot.png"
                alt="Homico AI"
                width={64}
                height={64}
                className="w-full h-full object-cover scale-[1.15]"
                priority
              />
            </div>

            {/* Drag handle dots — visible on hover to hint draggability */}
            <div
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 transition-opacity duration-200 ${
                isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-neutral-400" />
              <span className="w-1 h-1 rounded-full bg-neutral-400" />
              <span className="w-1 h-1 rounded-full bg-neutral-400" />
            </div>

            {/* X dismiss badge */}
            {!isDragging && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHidden(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    setIsHidden(true);
                  }
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-700/80 hover:bg-[var(--hm-error-500)] rounded-full flex items-center justify-center shadow-md transition-colors z-10 cursor-pointer opacity-0 group-hover:opacity-100"
                aria-label="Hide AI Assistant"
              >
                <X className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Tooltip */}
            <div
              className={`hidden sm:block absolute bottom-full mb-2 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none ${fabSide === "right" ? "right-0" : "left-0"}`}
            >
              Homico AI · {isDragging ? "↕" : t("ai.dragToMove")}
              <div
                className={`absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 ${fabSide === "right" ? "right-4" : "left-4"}`}
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel - fullscreen on mobile, positioned panel on desktop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — click outside to close (desktop only) */}
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
              <div className="bg-gradient-to-r from-[var(--hm-brand-500)] to-[#A85D47] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden p-0.5">
                    <Image
                      src="/AI-mascot.png"
                      alt="Homico AI"
                      width={36}
                      height={36}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-sm">
                      Homico AI
                    </h2>
                    <p className="text-white/70 text-xs">
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
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      setIsHidden(true);
                    }}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10"
                    title={t("ai.hide")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                      <Image
                        src="/AI-mascot.png"
                        alt="Homico AI"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover scale-[1.15]"
                      />
                    </div>
                    <h3
                      className="text-base font-semibold mb-1"
                      style={{ color: "var(--hm-fg-primary)" }}
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
                    />
                  ))
                )}

                {isLoading && <TypingIndicator />}

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
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={!isAuthenticated ? t("ai.loginToChat") : t("ai.askQuestion")}
                    disabled={isLoading || !isAuthenticated}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={
                      !inputValue.trim() || isLoading || !isAuthenticated
                    }
                    size="sm"
                    className="p-2.5 rounded-xl"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
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
