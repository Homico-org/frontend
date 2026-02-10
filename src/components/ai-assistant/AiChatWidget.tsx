'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Minimize2, Send, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import RichContentRenderer from './RichContentRenderer';
import { ChatMessage, SuggestedAction } from './types';
import { useAiChat } from './useAiChat';

// Message bubble component
function MessageBubble({
  message,
  locale,
  onAction,
}: {
  message: ChatMessage;
  locale: string;
  onAction: (action: SuggestedAction) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-[#C4735B] text-white rounded-br-md'
            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

        {/* Rich Content */}
        {!isUser && message.richContent && message.richContent.length > 0 && (
          <div className="mt-2">
            {message.richContent.map((content, idx) => (
              <RichContentRenderer key={idx} content={content} locale={locale} />
            ))}
          </div>
        )}

        {/* Suggested Actions */}
        {!isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-neutral-100">
            {message.suggestedActions.map((action, idx) => (
              <SuggestedActionButton key={idx} action={action} locale={locale} onAction={onAction} />
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
  locale,
  onAction,
}: {
  action: SuggestedAction;
  locale: string;
  onAction: (action: SuggestedAction) => void;
}) {
  const label =
    locale === 'ka' && action.labelKa
      ? action.labelKa
      : locale === 'ru' && action.labelRu
        ? action.labelRu
        : action.label;

  if (action.type === 'link' && action.url) {
    return (
      <Link
        href={action.url}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#C4735B]/10 text-[#C4735B] rounded-full hover:bg-[#C4735B]/20 transition-colors"
      >
        {label}
        <span className="text-[10px]">→</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
    >
      {label}
    </button>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobileRef = useRef<boolean>(false);

  // Draggable FAB state
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fabSide, setFabSide] = useState<'right' | 'left'>('right');
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Initialize FAB position
  useEffect(() => {
    if (fabPosition === null && typeof window !== 'undefined') {
      setFabPosition({ x: window.innerWidth - 80, y: window.innerHeight - 160 });
    }
  }, [fabPosition]);

  // Snap to nearest side
  const snapToSide = useCallback((x: number, y: number) => {
    const midX = window.innerWidth / 2;
    const fabSize = 64;
    const margin = 16;
    const maxY = window.innerHeight - fabSize - margin;
    const minY = margin + 56; // below header

    const clampedY = Math.max(minY, Math.min(maxY, y));

    if (x + fabSize / 2 < midX) {
      setFabSide('left');
      return { x: margin, y: clampedY };
    } else {
      setFabSide('right');
      return { x: window.innerWidth - fabSize - margin, y: clampedY };
    }
  }, []);

  // Touch/mouse drag handlers
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!fabPosition) return;
    dragRef.current = { startX: clientX, startY: clientY, startPosX: fabPosition.x, startPosY: fabPosition.y, moved: false };
    setIsDragging(true);
  }, [fabPosition]);

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
    const onMouseMove = (e: MouseEvent) => { e.preventDefault(); handleDragMove(e.clientX, e.clientY); };
    const onMouseUp = () => { handleDragEnd(); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => { handleDragEnd(); };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => { window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd); };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Re-snap on window resize
  useEffect(() => {
    const onResize = () => {
      if (fabPosition) {
        const snapped = snapToSide(fabPosition.x, fabPosition.y);
        setFabPosition(snapped);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fabPosition, snapToSide]);

  const { locale, t } = useLanguage();
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
      const userRole = user?.role || 'guest';
      initSession(locale, userRole);
    }
  }, [isOpen, isInitialized, locale, user?.role, initSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(max-width: 639px)');
    const update = () => {
      isMobileRef.current = mql.matches;
    };

    update();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
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

  const handleChatClickCapture = useCallback((e: React.MouseEvent) => {
    if (!isMobileRef.current) return;
    if (!isOpen) return;

    const target = e.target as HTMLElement | null;
    const anchor = target?.closest?.('a');
    if (!anchor) return;

    // Let normal navigation proceed, but collapse widget immediately
    setIsOpen(false);
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage(message, locale, pathname);
  }, [inputValue, isLoading, sendMessage, locale, pathname]);

  const handleSuggestedAction = useCallback(async (
    action: SuggestedAction,
  ) => {
    if (action.type === 'action') {
      const localizedAction =
        locale === 'ka'
          ? action.actionKa
          : locale === 'ru'
            ? action.actionRu
            : action.action;

      const text = localizedAction || action.action || action.label;
      if (!text?.trim()) return;
      await sendMessage(text, locale, pathname);
    }
  }, [sendMessage, locale, pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChat(locale);
  };

  // Quick prompts for empty state
  const quickPrompts = {
    en: [
      'Who is the best plumber?',
      'How do I register as a professional?',
    ],
    ka: [
      'ვინ არის საუკეთესო სანტექნიკოსი?',
      'როგორ დავრეგისტრირდე პროფესიონალად?',
    ],
    ru: [
      'Кто лучший сантехник?',
      'Как зарегистрироваться как специалист?',
    ],
  };

  const currentPrompts = quickPrompts[locale as keyof typeof quickPrompts] || quickPrompts.en;

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
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => setIsHidden(false)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1 pl-2 pr-1 py-3 bg-[#C4735B] text-white rounded-l-xl shadow-lg hover:pr-2 hover:shadow-xl transition-all group"
            aria-label="Show AI Assistant"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              <Image src="/AI-mascot.png" alt="AI" width={28} height={28} className="w-full h-full object-cover scale-[1.15]" />
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
            animate={{
              scale: isDragging ? 1.15 : 1,
              opacity: 1,
              boxShadow: isDragging
                ? '0 12px 40px rgba(196, 115, 91, 0.5)'
                : '0 4px 16px rgba(196, 115, 91, 0.3)',
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              scale: { type: 'spring', stiffness: 400, damping: 25 },
              opacity: { duration: 0.2 },
            }}
            onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, e.clientY); }}
            onTouchStart={(e) => { if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
            className="fixed z-40 group touch-none rounded-full"
            style={{
              left: fabPosition.x,
              top: fabPosition.y,
              transition: isDragging ? 'none' : 'left 0.35s cubic-bezier(0.32, 0.72, 0, 1), top 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            aria-label="Open AI Assistant"
          >
            {/* Pulse animation ring */}
            {showPulse && !isDragging && (
              <motion.span
                className="absolute inset-0 rounded-full bg-[#C4735B]"
                animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
            )}

            {/* Mascot Button */}
            <motion.div
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-lg"
              whileHover={!isDragging ? { scale: 1.1 } : undefined}
              whileTap={!isDragging ? { scale: 0.95 } : undefined}
            >
              <motion.div
                className="w-full h-full"
                animate={isDragging ? { scale: [1.15, 1.2, 1.15] } : { scale: [1.15, 1.18, 1.15] }}
                transition={isDragging
                  ? { duration: 0.4, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }
              >
                <Image
                  src="/AI-mascot.png"
                  alt="Homico AI"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* X dismiss badge */}
            {!isDragging && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setIsHidden(true); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setIsHidden(true); } }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-700 hover:bg-red-500 rounded-full flex items-center justify-center shadow-md transition-colors z-10 cursor-pointer"
                aria-label="Hide AI Assistant"
              >
                <X className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Tooltip */}
            <AnimatePresence>
              {!isDragging && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className={`hidden sm:block absolute bottom-full mb-2 px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-lg group-hover:!opacity-100 transition-opacity whitespace-nowrap pointer-events-none ${fabSide === 'right' ? 'right-0' : 'left-0'}`}
                >
                  Homico AI
                  <div className={`absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 ${fabSide === 'right' ? 'right-4' : 'left-4'}`} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel - fullscreen on mobile, positioned panel on desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="ai-chat-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClickCapture={handleChatClickCapture}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[400px] sm:max-w-[calc(100vw-48px)] sm:h-[650px] sm:max-h-[calc(100vh-120px)] bg-[#FAFAF9] sm:rounded-2xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden sm:border sm:border-neutral-200"
          >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#C4735B] to-[#A85D47] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden p-0.5">
                <Image src="/AI-mascot.png" alt="Homico AI" width={36} height={36} className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Homico AI</h2>
                <p className="text-white/70 text-xs">
                  {locale === 'ka' ? 'ინტელექტუალური ასისტენტი' : locale === 'ru' ? 'Умный Ассистент' : 'Smart Assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={locale === 'ka' ? 'ჩატის გასუფთავება' : 'Clear chat'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={locale === 'ka' ? 'ჩატის მინიმიზაცია' : 'Minimize'}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setIsOpen(false); setIsHidden(true); }}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={locale === 'ka' ? 'ჩატის დამალვა' : 'Hide'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                  <Image src="/AI-mascot.png" alt="Homico AI" width={80} height={80} className="w-full h-full object-cover scale-[1.15]" />
                </div>
                <h3 className="text-base font-semibold text-neutral-800 mb-1">
                  {locale === 'ka' ? 'გამარჯობა! მე ვარ Homico AI' : locale === 'ru' ? 'Привет! Я Homico AI' : 'Hi! I\'m Homico AI'}
                </h3>
                <p className="text-sm text-neutral-500 mb-5 max-w-[260px]">
                  {locale === 'ka'
                    ? 'შედით ანგარიშზე რომ ჩემთან საუბარი დაიწყოთ'
                    : locale === 'ru'
                    ? 'Войдите в аккаунт, чтобы начать общение'
                    : 'Log in to your account to start chatting with me'}
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openLoginModal();
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#C4735B' }}
                >
                  {locale === 'ka' ? 'შესვლა' : locale === 'ru' ? 'Войти' : 'Log in'}
                </button>
              </div>
            ) : messages.length === 0 ? (
              <>
                {/* Quick prompts */}
                <div className="pt-4">
                  <p className="text-xs text-neutral-500 text-center mb-2">
                    {locale === 'ka' ? 'სცადეთ კითხვა:' : locale === 'ru' ? 'Попробуйте спросить:' : 'Try asking:'}
                  </p>
                  <div className="space-y-2">
                    {currentPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputValue(prompt);
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:border-[#C4735B]/30 hover:bg-[#C4735B]/5 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              messages.map((message, idx) => (
                <MessageBubble key={idx} message={message} locale={locale} onAction={handleSuggestedAction} />
              ))
            )}

            {isLoading && <TypingIndicator />}

            {error && (
              <div className="text-center py-2">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t border-neutral-200 bg-white ${!isAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !isAuthenticated
                    ? (locale === 'ka' ? 'შედით ანგარიშზე...' : locale === 'ru' ? 'Войдите в аккаунт...' : 'Log in to chat...')
                    : locale === 'ka'
                    ? 'დასვით შეკითხვა...'
                    : locale === 'ru'
                    ? 'Задайте вопрос...'
                    : 'Ask a question...'
                }
                className="flex-1 px-4 py-2.5 bg-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4735B]/30 focus:bg-white transition-all"
                disabled={isLoading || !isAuthenticated}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading || !isAuthenticated}
                className="p-2.5 bg-[#C4735B] text-white rounded-xl hover:bg-[#A85D47] disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 text-center mt-2">
              {locale === 'ka'
                ? 'Homico AI შეიძლება შეცდეს. გადაამოწმეთ მნიშვნელოვანი ინფორმაცია.'
                : locale === 'ru'
                ? 'Homico AI может ошибаться. Проверяйте важную информацию.'
                : 'Homico AI can make mistakes. Verify important information.'}
            </p>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
