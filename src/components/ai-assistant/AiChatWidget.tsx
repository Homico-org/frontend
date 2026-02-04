'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Minimize2, Send, Sparkles, Trash2, X } from 'lucide-react';
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

// Welcome message component
function WelcomeMessage({ locale }: { locale: string }) {
  const welcomeMessages = {
    en: {
      title: 'Hi! I\'m Homico AI 👋',
      subtitle: 'Your intelligent renovation assistant. I can help you with:',
      items: [
        'Finding the best professionals',
        'Real price estimates from our database',
        'Step-by-step platform guidance',
        'Renovation planning advice',
      ],
    },
    ka: {
      title: 'გამარჯობა! მე ვარ Homico AI 👋',
      subtitle: 'თქვენი ინტელექტუალური რემონტის ასისტენტი. შემიძლია დაგეხმაროთ:',
      items: [
        'საუკეთესო პროფესიონალების პოვნაში',
        'რეალური ფასების შეფასებაში',
        'პლატფორმის გამოყენების ახსნაში',
        'რემონტის დაგეგმვაში',
      ],
    },
    ru: {
      title: 'Привет! Я Homico AI 👋',
      subtitle: 'Ваш интеллектуальный ассистент по ремонту. Я могу помочь с:',
      items: [
        'Поиском лучших специалистов',
        'Реальными оценками цен из базы',
        'Пошаговым руководством по платформе',
        'Планированием ремонта',
      ],
    },
  };

  const content = welcomeMessages[locale as keyof typeof welcomeMessages] || welcomeMessages.en;

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#C4735B] to-[#A85D47] rounded-full flex items-center justify-center shadow-lg shadow-[#C4735B]/20">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-bold text-neutral-900 mb-1">{content.title}</h3>
      <p className="text-sm text-neutral-500 mb-3">{content.subtitle}</p>
      <ul className="text-left text-sm text-neutral-600 space-y-1.5 max-w-[220px] mx-auto">
        {content.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C4735B] mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { locale, t } = useLanguage();
  const { user } = useAuth();
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
      const text = action.action || action.label;
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
      'What does bathroom renovation cost?',
    ],
    ka: [
      'ვინ არის საუკეთესო სანტექნიკოსი?',
      'როგორ დავრეგისტრირდე პროფესიონალად?',
      'რა ღირს აბაზანის რემონტი?',
    ],
    ru: [
      'Кто лучший сантехник?',
      'Как зарегистрироваться как специалист?',
      'Сколько стоит ремонт ванной?',
    ],
  };

  const currentPrompts = quickPrompts[locale as keyof typeof quickPrompts] || quickPrompts.en;

  return (
    <>
      {/* Floating Button - positioned above mobile navbar */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 group ${isOpen ? 'hidden' : ''}`}
        aria-label="Open AI Assistant"
      >
        {/* Pulse animation ring */}
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-[#C4735B] animate-ping opacity-30" />
        )}

        {/* Button */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-[#C4735B] to-[#A85D47] rounded-full shadow-lg shadow-[#C4735B]/30 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 group-active:scale-95">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {locale === 'ka' ? 'Homico AI - ინტელექტუალური ასისტენტი' : locale === 'ru' ? 'Homico AI - Умный Ассистент' : 'Homico AI - Smart Assistant'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900" />
        </div>
      </button>

      {/* Chat Panel - fullscreen on mobile, positioned panel on desktop */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[400px] sm:max-w-[calc(100vw-48px)] sm:h-[650px] sm:max-h-[calc(100vh-120px)] bg-[#FAFAF9] sm:rounded-2xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden sm:border sm:border-neutral-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#C4735B] to-[#A85D47] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
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
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.length === 0 ? (
              <>
                <WelcomeMessage locale={locale} />

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
          <div className="p-4 border-t border-neutral-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  locale === 'ka'
                    ? 'დასვით შეკითხვა...'
                    : locale === 'ru'
                    ? 'Задайте вопрос...'
                    : 'Ask a question...'
                }
                className="flex-1 px-4 py-2.5 bg-neutral-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4735B]/30 focus:bg-white transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
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
        </div>
      )}
    </>
  );
}
