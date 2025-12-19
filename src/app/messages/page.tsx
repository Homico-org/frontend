'use client';

import Avatar from '@/components/common/Avatar';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Edit3,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

// Terracotta accent color matching the app
const ACCENT_COLOR = '#C4735B';

// Types
interface Conversation {
  _id: string;
  participant: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    title?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  isOnline?: boolean;
}

interface Message {
  _id: string;
  content: string;
  senderId: string;
  createdAt: string;
  type: 'text' | 'image';
  imageUrl?: string;
  isRead?: boolean;
}

// Mock data for development
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    _id: '1',
    participant: {
      _id: 'p1',
      name: 'Giorgi Beridze',
      avatar: '',
      role: 'pro',
      title: 'ELECTRICIAN',
    },
    lastMessage: {
      content: 'Sure, give me a second.',
      createdAt: new Date().toISOString(),
      senderId: 'p1',
    },
    unreadCount: 0,
    isOnline: true,
  },
  {
    _id: '2',
    participant: {
      _id: 'p2',
      name: 'Nino Kvaratskhelia',
      avatar: '',
      role: 'pro',
      title: 'CLEANER',
    },
    lastMessage: {
      content: 'I will be there on Tuesday.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      senderId: 'p2',
    },
    unreadCount: 0,
    isOnline: false,
  },
  {
    _id: '3',
    participant: {
      _id: 'p3',
      name: 'David Gelashvili',
      avatar: '',
      role: 'pro',
      title: 'PLUMBER',
    },
    lastMessage: {
      content: 'Offer accepted',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      senderId: 'me',
    },
    unreadCount: 0,
    isOnline: false,
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    _id: 'm1',
    content: "Hi Giorgi, thanks for the quote. I'm reviewing it now.",
    senderId: 'me',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'text',
  },
  {
    _id: 'm2',
    content: 'No problem. Before I confirm the date, can you check the brand of the panel? I need to make sure I bring the right breakers.',
    senderId: 'p1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    type: 'text',
  },
  {
    _id: 'm3',
    content: 'Sure, give me a second.',
    senderId: 'me',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    type: 'text',
  },
  {
    _id: 'm4',
    content: '',
    senderId: 'me',
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    type: 'image',
    imageUrl: '/placeholder-panel.jpg',
  },
];

// Helper function to format time
function formatMessageTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffDays === 1) {
    return locale === 'ka' ? 'გუშინ' : 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      weekday: 'short',
    });
  } else {
    return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

function formatDateDivider(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return locale === 'ka' ? 'დღეს' : 'Today';
  } else if (diffDays === 1) {
    return locale === 'ka' ? 'გუშინ' : 'Yesterday';
  } else {
    return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

// Conversation List Item Component
function ConversationItem({
  conversation,
  isSelected,
  onClick,
  locale,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  locale: string;
}) {
  const { participant, lastMessage, unreadCount, isOnline } = conversation;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 text-left transition-all duration-200 border-l-2 ${
        isSelected
          ? 'bg-[#FDF8F6] border-l-[#C4735B]'
          : 'border-l-transparent hover:bg-neutral-50'
      }`}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={participant.avatar}
          name={participant.name}
          size="md"
          className="w-11 h-11"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-neutral-900 truncate text-[15px]">
            {participant.name}
          </span>
          {lastMessage && (
            <span className="text-xs flex-shrink-0" style={{ color: isSelected ? ACCENT_COLOR : '#9ca3af' }}>
              {formatMessageTime(lastMessage.createdAt, locale)}
            </span>
          )}
        </div>
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: ACCENT_COLOR }}>
          {participant.title}
        </span>
        {lastMessage && (
          <p className="text-sm text-neutral-500 truncate mt-0.5">
            {lastMessage.content}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold text-white flex items-center justify-center"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isMine,
  showAvatar,
  participant,
}: {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  participant?: Conversation['participant'];
}) {
  if (message.type === 'image') {
    return (
      <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && showAvatar && participant && (
          <Avatar
            src={participant.avatar}
            name={participant.name}
            size="sm"
            className="w-8 h-8 flex-shrink-0"
          />
        )}
        {!isMine && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div
          className={`max-w-[280px] rounded-2xl overflow-hidden border-2 ${
            isMine ? 'border-[#C4735B]/30 bg-[#FDF5F0]' : 'border-neutral-200 bg-white'
          }`}
        >
          <div className="aspect-[4/3] bg-[#F5E6D3] flex items-center justify-center">
            {message.imageUrl ? (
              <img
                src={message.imageUrl.startsWith('http') || message.imageUrl.startsWith('data:')
                  ? message.imageUrl
                  : storage.getFileUrl(message.imageUrl)}
                alt="Shared image"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#F5E6D3] flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-[#C4735B]/40" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && showAvatar && participant && (
        <Avatar
          src={participant.avatar}
          name={participant.name}
          size="sm"
          className="w-8 h-8 flex-shrink-0"
        />
      )}
      {!isMine && !showAvatar && <div className="w-8 flex-shrink-0" />}

      <div
        className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
          isMine
            ? 'bg-[#C4735B] text-white rounded-br-md'
            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
        }`}
      >
        <p className="text-[15px] leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

// Typing Indicator Component
function TypingIndicator({ participant }: { participant: Conversation['participant'] }) {
  return (
    <div className="flex items-end gap-2">
      <Avatar
        src={participant.avatar}
        name={participant.name}
        size="sm"
        className="w-8 h-8 flex-shrink-0"
      />
      <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Main Messages Page Component
export default function MessagesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(MOCK_CONVERSATIONS[0]);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: Message = {
      _id: `m${Date.now()}`,
      content: newMessage.trim(),
      senderId: 'me',
      createdAt: new Date().toISOString(),
      type: 'text',
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedConversation) {
      const reader = new FileReader();
      reader.onload = () => {
        const newMsg: Message = {
          _id: `m${Date.now()}`,
          content: '',
          senderId: 'me',
          createdAt: new Date().toISOString(),
          type: 'image',
          imageUrl: reader.result as string,
        };
        setMessages((prev) => [...prev, newMsg]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Select conversation
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsMobileListOpen(false);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <HeaderSpacer />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <HeaderSpacer />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversation List */}
        <aside
          className={`
            w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-neutral-200 flex flex-col bg-white
            ${isMobileListOpen ? 'flex' : 'hidden md:flex'}
          `}
        >
          {/* Sidebar Header */}
          <div className="flex-shrink-0 p-5 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-neutral-900">
                {locale === 'ka' ? 'შეტყობინებები' : 'Messages'}
              </h1>
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-neutral-100"
                style={{ color: ACCENT_COLOR }}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'ka' ? 'მიმოწერის ძებნა...' : 'Search conversations...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm placeholder-neutral-400 focus:outline-none focus:border-[#C4735B]/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                {locale === 'ka' ? 'მიმოწერა ვერ მოიძებნა' : 'No conversations found'}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  isSelected={selectedConversation?._id === conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  locale={locale}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right Side - Chat Area */}
        <main
          className={`
            flex-1 flex flex-col bg-[#FAFAFA]
            ${!isMobileListOpen ? 'flex' : 'hidden md:flex'}
          `}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex-shrink-0 h-[72px] px-5 flex items-center justify-between border-b border-neutral-200 bg-white">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setIsMobileListOpen(true)}
                    className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-neutral-100 mr-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <Avatar
                    src={selectedConversation.participant.avatar}
                    name={selectedConversation.participant.name}
                    size="md"
                    className="w-11 h-11"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">
                        {selectedConversation.participant.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: '#E8956A', color: 'white' }}
                      >
                        PRO
                      </span>
                      <span className="text-green-600 font-medium">
                        {selectedConversation.isOnline
                          ? locale === 'ka' ? 'ონლაინ' : 'Online'
                          : locale === 'ka' ? 'ოფლაინ' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/professionals/${selectedConversation.participant._id}`}
                    className="px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    {locale === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
                  </Link>
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-neutral-100 text-neutral-500">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="max-w-3xl mx-auto space-y-6">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      {/* Date Divider */}
                      <div className="flex items-center justify-center mb-6">
                        <span className="px-3 py-1 bg-neutral-200/60 rounded-full text-xs font-medium text-neutral-500">
                          {formatDateDivider(msgs[0].createdAt, locale)}
                        </span>
                      </div>

                      {/* Messages */}
                      <div className="space-y-3">
                        {msgs.map((message, idx) => {
                          const isMine = message.senderId === 'me';
                          const showAvatar =
                            !isMine &&
                            (idx === 0 || msgs[idx - 1].senderId === 'me');

                          return (
                            <MessageBubble
                              key={message._id}
                              message={message}
                              isMine={isMine}
                              showAvatar={showAvatar}
                              participant={selectedConversation.participant}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && selectedConversation && (
                    <TypingIndicator participant={selectedConversation.participant} />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="flex-shrink-0 p-4 bg-white border-t border-neutral-200">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 bg-neutral-50 rounded-2xl border border-neutral-200 px-4 py-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/50 transition-colors"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={locale === 'ka' ? 'დაწერე შეტყობინება...' : 'Type your message...'}
                      className="flex-1 bg-transparent text-[15px] placeholder-neutral-400 focus:outline-none"
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: ACCENT_COLOR }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 text-right mt-2">
                    {locale === 'ka' ? 'დააჭირე Enter-ს გასაგზავნად' : 'Press Enter to send'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">
                  {locale === 'ka' ? 'აირჩიე მიმოწერა' : 'Select a conversation'}
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  {locale === 'ka' ? 'აირჩიე მიმოწერა სიიდან' : 'Choose from your conversations'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
