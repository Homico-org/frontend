'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Minimize2, Send, Sparkles, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage, SuggestedAction } from './types';
import { useAiChat } from './useAiChat';

// Message bubble component
function MessageBubble({ message, locale }: { message: ChatMessage; locale: string }) {
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

        {/* Suggested Actions */}
        {!isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-neutral-100">
            {message.suggestedActions.map((action, idx) => (
              <SuggestedActionButton key={idx} action={action} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Suggested action button
function SuggestedActionButton({ action, locale }: { action: SuggestedAction; locale: string }) {
  const label = locale === 'ka' && action.labelKa ? action.labelKa : action.label;

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
    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors">
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
      subtitle: 'Your AI renovation assistant. I can help you with:',
      items: [
        'Cost estimates for renovation projects',
        'Finding the right professional',
        'Planning your renovation',
        'Understanding the process',
      ],
    },
    ka: {
      title: 'გამარჯობა! მე ვარ Homico AI 👋',
      subtitle: 'თქვენი AI რემონტის ასისტენტი. შემიძლია დაგეხმაროთ:',
      items: [
        'რემონტის ხარჯთაღრიცხვაში',
        'სწორი სპეციალისტის პოვნაში',
        'რემონტის დაგეგმვაში',
        'პროცესის გაგებაში',
      ],
    },
    ru: {
      title: 'Привет! Я Homico AI 👋',
      subtitle: 'Ваш AI-ассистент по ремонту. Я могу помочь с:',
      items: [
        'Оценка стоимости ремонта',
        'Поиск нужного специалиста',
        'Планирование ремонта',
        'Понимание процесса',
      ],
    },
  };

  const content = welcomeMessages[locale as keyof typeof welcomeMessages] || welcomeMessages.en;

  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 mx-auto mb-3 relative">
        <Image
          src="/homi-mascot.png"
          alt="Homi"
          fill
          className="object-contain"
          onError={(e) => {
            // Fallback if image not found
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <h3 className="font-bold text-neutral-900 mb-1">{content.title}</h3>
      <p className="text-sm text-neutral-500 mb-3">{content.subtitle}</p>
      <ul className="text-left text-sm text-neutral-600 space-y-1.5 max-w-[200px] mx-auto">
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
      'How much does a bathroom renovation cost?',
      'How do I find a reliable contractor?',
      'What should I know before starting renovation?',
    ],
    ka: [
      'რა ღირს აბაზანის რემონტი?',
      'როგორ ვიპოვო საიმედო ხელოსანი?',
      'რა უნდა ვიცოდე რემონტის დაწყებამდე?',
    ],
    ru: [
      'Сколько стоит ремонт ванной?',
      'Как найти надежного мастера?',
      'Что нужно знать перед началом ремонта?',
    ],
  };

  const currentPrompts = quickPrompts[locale as keyof typeof quickPrompts] || quickPrompts.en;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 group ${isOpen ? 'hidden' : ''}`}
        aria-label="Open AI Assistant"
      >
        {/* Pulse animation ring */}
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-[#C4735B] animate-ping opacity-30" />
        )}

        {/* Button */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-[#C4735B] to-[#A85D47] rounded-full shadow-lg shadow-[#C4735B]/30 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 group-active:scale-95">
          <Image
            src="/homi-mascot.png"
            alt="Homi AI Assistant"
            width={48}
            height={48}
            className="object-contain"
            onError={(e) => {
              // Fallback to sparkles icon if mascot not found
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Fallback icon */}
          <Sparkles className="w-7 h-7 text-white absolute" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {locale === 'ka' ? 'Homico - AI ასისტენტი' : locale === 'ru' ? 'Homico - AI Ассистент' : 'Homico - AI Assistant'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900" />
        </div>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-[#FAFAF9] rounded-2xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden border border-neutral-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#C4735B] to-[#A85D47] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/homi-mascot.png"
                  alt="Homi"
                  width={32}
                  height={32}
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <Sparkles className="w-5 h-5 text-white absolute" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Homico AI</h2>
                <p className="text-white/70 text-xs">
                  {locale === 'ka' ? 'AI ასისტენტი' : locale === 'ru' ? 'AI Ассистент' : 'AI Assistant'}
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
                <MessageBubble key={idx} message={message} locale={locale} />
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
                ? 'Homico შეიძლება შეცდეს. გადაამოწმეთ მნიშვნელოვანი ინფორმაცია.'
                : locale === 'ru'
                ? 'Homico может ошибаться. Проверяйте важную информацию.'
                : 'Homico can make mistakes. Verify important information.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
