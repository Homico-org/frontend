'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics, AnalyticsEvent } from '@/hooks/useAnalytics';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Edit3,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { io, Socket } from 'socket.io-client';

// Terracotta accent color matching the design system (--color-accent)
const ACCENT_COLOR = '#E07B4F';

// Types
interface Participant {
  _id: string;
  name: string;
  avatar?: string;
  role: string;
  title?: string;
  proProfileId?: string;
}

interface Conversation {
  _id: string;
  participant: Participant;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

interface Message {
  _id: string;
  content: string;
  senderId: string | { _id: string; name: string; avatar?: string };
  createdAt: string;
  attachments?: string[];
  isRead?: boolean;
}

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

// Get sender ID from message (handles both string and populated object)
function getSenderId(senderId: string | { _id: string }): string {
  if (typeof senderId === 'string') return senderId;
  return senderId._id;
}

// Conversation List Item Component
function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onDelete,
  locale,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  locale: string;
}) {
  const { participant, lastMessage, unreadCount } = conversation;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div
      className={`relative w-full flex items-start gap-3 p-4 text-left transition-all duration-200 border-l-2 group ${
        isSelected
          ? 'bg-[#FEF6F3] border-l-[#E07B4F]'
          : 'border-l-transparent hover:bg-neutral-50'
      }`}
    >
      {/* Main clickable area */}
      <button onClick={onClick} className="flex items-start gap-3 flex-1 min-w-0 text-left">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={participant.avatar}
            name={participant.name}
            size="md"
            className="w-11 h-11"
          />
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
          {participant.title && (
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: ACCENT_COLOR }}>
              {participant.title}
            </span>
          )}
          {lastMessage && (
            <p className="text-sm text-neutral-500 truncate mt-0.5">
              {lastMessage.content}
            </p>
          )}
        </div>
      </button>

      {/* Right side: unread badge or menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold text-white flex items-center justify-center"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            {unreadCount}
          </span>
        )}

        {/* Menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all ${
              showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {locale === 'ka' ? 'წაშლა' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
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
  participant?: Participant;
}) {
  const hasAttachments = message.attachments && message.attachments.length > 0;

  if (hasAttachments) {
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

        <div className="space-y-2">
          {message.attachments?.map((attachment, idx) => (
            <div
              key={idx}
              className={`max-w-[280px] rounded-2xl overflow-hidden border-2 ${
                isMine ? 'border-[#E07B4F]/30 bg-[#FEF6F3]' : 'border-neutral-200 bg-white'
              }`}
            >
              <img
                src={storage.getFileUrl(attachment)}
                alt="Attachment"
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
          {message.content && (
            <div
              className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                isMine
                  ? 'bg-[#E07B4F] text-white rounded-br-md'
                  : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
              }`}
            >
              <p className="text-[15px] leading-relaxed">{message.content}</p>
            </div>
          )}
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
            ? 'bg-[#E07B4F] text-white rounded-br-md'
            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
        }`}
      >
        <p className="text-[15px] leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

// Chat Content Component - handles messages for a specific conversation
const ChatContent = memo(function ChatContent({
  conversation,
  userId,
  locale,
  socketRef,
  onBack,
  onConversationUpdate,
}: {
  conversation: Conversation;
  userId: string;
  locale: string;
  socketRef: React.MutableRefObject<Socket | null>;
  onBack: () => void;
  onConversationUpdate: (conversationId: string, lastMessage: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages for this conversation
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const response = await api.get(`/messages/conversation/${conversation._id}`);
        setMessages(response.data);

        // Mark messages as read
        try {
          await api.patch(`/messages/conversation/${conversation._id}/read-all`);
          await api.patch(`/conversations/${conversation._id}/read`);
        } catch (e) {
          // Ignore read errors
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [conversation._id]);

  // Join/leave conversation room
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('joinConversation', conversation._id);

    const handleNewMessage = (message: Message) => {
      const messageSenderId = getSenderId(message.senderId);

      // If this is my own message, skip - the API response will handle it
      if (messageSenderId === userId) {
        return;
      }

      setMessages(prev => {
        // Skip if this exact message already exists
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleTyping = ({ odliserId: typingUserId, isTyping: typing }: { odliserId: string; isTyping: boolean }) => {
      if (typingUserId !== userId) {
        setOtherUserTyping(typing);
      }
    };

    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('userTyping', handleTyping);

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveConversation', conversation._id);
        socketRef.current.off('newMessage', handleNewMessage);
        socketRef.current.off('userTyping', handleTyping);
      }
    };
  }, [conversation._id, socketRef, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { conversationId: conversation._id, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current) {
        socketRef.current.emit('typing', { conversationId: conversation._id, isTyping: false });
      }
    }, 2000);
  }, [conversation._id, isTyping, socketRef]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    setNewMessage('');
    setIsSending(true);

    const tempMessage: Message = {
      _id: tempId,
      content: messageContent,
      senderId: userId,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await api.post('/messages', {
        conversationId: conversation._id,
        content: messageContent,
      });

      // Replace temp message with real message from API response
      setMessages(prev => prev.map(m => (m._id === tempId ? response.data : m)));

      onConversationUpdate(conversation._id, messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const response = await api.post('/messages', {
        conversationId: conversation._id,
        content: '',
        attachments: [uploadResponse.data.url || uploadResponse.data.filename],
      });

      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }

    e.target.value = '';
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    return messages.reduce((groups, message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {} as Record<string, Message[]>);
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 h-[72px] px-5 flex items-center justify-between border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-neutral-100 mr-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <Link
            href={
              conversation.participant.role === 'pro'
                ? `/professionals/${conversation.participant.proProfileId || conversation.participant._id}`
                : `/users/${conversation.participant._id}`
            }
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={conversation.participant.avatar}
              name={conversation.participant.name}
              size="md"
              className="w-11 h-11"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900">
                  {conversation.participant.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {conversation.participant.role === 'pro' && (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-semibold"
                    style={{ backgroundColor: '#E8956A', color: 'white' }}
                  >
                    PRO
                  </span>
                )}
                {conversation.participant.title && (
                  <span className="text-neutral-500">
                    {conversation.participant.title}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
              <p>{locale === 'ka' ? 'ჯერ არ არის შეტყობინება' : 'No messages yet'}</p>
              <p className="text-sm mt-1">
                {locale === 'ka' ? 'დაიწყეთ საუბარი' : 'Start the conversation'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center justify-center mb-6">
                  <span className="px-3 py-1 bg-neutral-200/60 rounded-full text-xs font-medium text-neutral-500">
                    {formatDateDivider(msgs[0].createdAt, locale)}
                  </span>
                </div>

                <div className="space-y-3">
                  {msgs.map((message, idx) => {
                    const senderId = getSenderId(message.senderId);
                    const isMine = senderId === userId;
                    const showAvatar =
                      !isMine &&
                      (idx === 0 || getSenderId(msgs[idx - 1].senderId) === userId);

                    return (
                      <MessageBubble
                        key={message._id}
                        message={message}
                        isMine={isMine}
                        showAvatar={showAvatar}
                        participant={conversation.participant}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />

            {otherUserTyping && (
              <div className="flex items-center gap-2 pl-10">
                <div className="flex gap-1 px-4 py-2 bg-white border border-neutral-200 rounded-2xl rounded-bl-md">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
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
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder={locale === 'ka' ? 'დაწერე შეტყობინება...' : 'Type your message...'}
              className="flex-1 bg-transparent text-[15px] placeholder-neutral-400 focus:outline-none"
              disabled={isSending}
            />

            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
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
    </div>
  );
});

// Main Messages Page Content Component
function MessagesPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const { trackEvent } = useAnalytics();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  // New conversation modal state
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Delete conversation state
  const [deleteModalConversation, setDeleteModalConversation] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Get conversation ID from URL if present - only read on initial load
  const urlConversationId = searchParams.get('conversation');
  const urlRecipientId = searchParams.get('recipient');
  const initialConversationIdRef = useRef(urlConversationId);
  const initialRecipientIdRef = useRef(urlRecipientId);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

    socketRef.current = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat WebSocket');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from chat WebSocket');
    });

    socketRef.current.on('conversationUpdate', (update: { conversationId: string; lastMessage: string; lastMessageAt: string }) => {
      // Update conversation list with new message
      setConversations(prev =>
        prev.map(c =>
          c._id === update.conversationId
            ? {
                ...c,
                lastMessage: {
                  content: update.lastMessage,
                  createdAt: update.lastMessageAt,
                  senderId: '',
                },
                unreadCount: selectedConversation?._id === update.conversationId ? 0 : c.unreadCount + 1,
              }
            : c
        )
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, user, selectedConversation?._id]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await api.get('/conversations');
      setConversations(response.data);

      // If URL has conversation ID and this is the initial load, select it
      if (!initialLoadDoneRef.current && initialConversationIdRef.current) {
        const conv = response.data.find((c: Conversation) => c._id === initialConversationIdRef.current);
        if (conv) {
          setSelectedConversation(conv);
          setIsMobileListOpen(false);
        }
      }
      // Always mark initial load as done
      initialLoadDoneRef.current = true;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Start new conversation if recipient ID is in URL (only on initial load)
  useEffect(() => {
    const startNewConversation = async () => {
      if (!initialRecipientIdRef.current || !isAuthenticated || isLoading) return;

      // Only run once
      const recipientId = initialRecipientIdRef.current;
      initialRecipientIdRef.current = null;

      try {
        const response = await api.post('/conversations/start', {
          recipientId,
        });

        const { conversation } = response.data;

        // Refresh conversations
        const convResponse = await api.get('/conversations');
        setConversations(convResponse.data);

        // Find and select the conversation
        const conv = convResponse.data.find((c: Conversation) => c._id === conversation._id);
        if (conv) {
          setSelectedConversation(conv);
          setIsMobileListOpen(false);
          // Update URL without triggering re-render
          window.history.replaceState({}, '', `/messages?conversation=${conversation._id}`);
        }
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    startNewConversation();
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.participant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Select conversation handler
  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    setIsMobileListOpen(false);
    // Update URL without navigation
    window.history.replaceState({}, '', `/messages?conversation=${conv._id}`);
  }, []);

  // Handle conversation update from ChatContent
  const handleConversationUpdate = useCallback((conversationId: string, lastMessage: string) => {
    setConversations(prev =>
      prev.map(c =>
        c._id === conversationId
          ? {
              ...c,
              lastMessage: {
                content: lastMessage,
                createdAt: new Date().toISOString(),
                senderId: user?.id || '',
              },
            }
          : c
      )
    );
  }, [user?.id]);

  // Handle back from chat
  const handleBackToList = useCallback(() => {
    setIsMobileListOpen(true);
  }, []);

  // Search for users to start new conversation
  const handleUserSearch = useCallback(async (query: string) => {
    setUserSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Search for pro profiles using existing endpoint
        const response = await api.get(`/users/pros?search=${encodeURIComponent(query)}&limit=10`);
        // API returns { data: [...], pagination: {...} }
        const results = response.data.data || response.data.profiles || response.data || [];
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Start conversation with selected user
  const handleStartConversation = useCallback(async (proProfile: any) => {
    try {
      const response = await api.post('/conversations/start', {
        recipientId: proProfile._id,
      });

      const { conversation } = response.data;

      // Refresh conversations list
      const convResponse = await api.get('/conversations');
      setConversations(convResponse.data);

      // Find and select the new conversation
      const conv = convResponse.data.find((c: Conversation) => c._id === conversation._id);
      if (conv) {
        setSelectedConversation(conv);
        setIsMobileListOpen(false);
        window.history.replaceState({}, '', `/messages?conversation=${conversation._id}`);
      }

      trackEvent(AnalyticsEvent.CONVERSATION_START, {
        proId: proProfile._id,
        proName: proProfile.name,
      });

      // Close modal
      setShowNewConversationModal(false);
      setUserSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [trackEvent]);

  // Delete conversation handler
  const handleDeleteConversation = useCallback(async () => {
    if (!deleteModalConversation) return;

    try {
      setIsDeleting(true);
      await api.delete(`/conversations/${deleteModalConversation._id}`);

      // Remove from list
      setConversations(prev => prev.filter(c => c._id !== deleteModalConversation._id));

      // If this was the selected conversation, deselect it
      if (selectedConversation?._id === deleteModalConversation._id) {
        setSelectedConversation(null);
        window.history.replaceState({}, '', '/messages');
      }

      setDeleteModalConversation(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModalConversation, selectedConversation]);

  if (authLoading || isLoading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <HeaderSpacer />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <p className="text-lg font-medium text-neutral-600">
              {locale === 'ka' ? 'გთხოვთ გაიაროთ ავტორიზაცია' : 'Please log in to view messages'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <Header />
      {/* Use fixed height for header space instead of HeaderSpacer to maintain h-screen layout */}
      <div className="h-14 flex-shrink-0" />

      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
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
                onClick={() => setShowNewConversationModal(true)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-neutral-100"
                style={{ color: ACCENT_COLOR }}
                title={locale === 'ka' ? 'ახალი მიმოწერა' : 'New conversation'}
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm placeholder-neutral-400 focus:outline-none focus:border-[#E07B4F]/50 focus:ring-2 focus:ring-[#E07B4F]/10 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <MessageCircle className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                <p>{locale === 'ka' ? 'მიმოწერა ვერ მოიძებნა' : 'No conversations yet'}</p>
                <p className="text-sm mt-1">
                  {locale === 'ka'
                    ? 'დაიწყეთ საუბარი პროფესიონალთან'
                    : 'Start a conversation with a professional'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  isSelected={selectedConversation?._id === conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  onDelete={() => setDeleteModalConversation(conv)}
                  locale={locale}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right Side - Chat Area */}
        <main
          className={`
            flex-1 flex flex-col bg-[#FAFAFA] min-h-0
            ${!isMobileListOpen ? 'flex' : 'hidden md:flex'}
          `}
        >
          {selectedConversation ? (
            <ChatContent
              key={selectedConversation._id}
              conversation={selectedConversation}
              userId={user?.id || ''}
              locale={locale}
              socketRef={socketRef}
              onBack={handleBackToList}
              onConversationUpdate={handleConversationUpdate}
            />
          ) : (
            /* No Conversation Selected */
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-neutral-400" />
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

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowNewConversationModal(false);
              setUserSearchQuery('');
              setSearchResults([]);
            }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">
                {locale === 'ka' ? 'ახალი მიმოწერა' : 'New Conversation'}
              </h2>
              <button
                onClick={() => {
                  setShowNewConversationModal(false);
                  setUserSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-neutral-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder={locale === 'ka' ? 'მოძებნე პროფესიონალი...' : 'Search for a professional...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm placeholder-neutral-400 focus:outline-none focus:border-[#E07B4F]/50 focus:ring-2 focus:ring-[#E07B4F]/10 focus:bg-white transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT_COLOR }} />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((profile) => (
                    <button
                      key={profile._id}
                      onClick={() => handleStartConversation(profile)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors text-left"
                    >
                      <Avatar
                        src={profile.avatar}
                        name={profile.name || 'Pro'}
                        size="md"
                        className="w-11 h-11"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 truncate">
                            {profile.name || 'Professional'}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                            style={{ backgroundColor: '#E8956A', color: 'white' }}
                          >
                            PRO
                          </span>
                        </div>
                        {(profile.title || profile.categories?.[0]) && (
                          <p className="text-sm text-neutral-500 truncate">
                            {profile.title || profile.categories?.[0]}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : userSearchQuery.trim() ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>{locale === 'ka' ? 'პროფესიონალი ვერ მოიძებნა' : 'No professionals found'}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-400">
                  <Search className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                  <p>{locale === 'ka' ? 'მოძებნე პროფესიონალი' : 'Search for a professional to start a conversation'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModalConversation(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {locale === 'ka' ? 'მიმოწერის წაშლა' : 'Delete Conversation'}
                </h3>
              </div>
              <button
                onClick={() => !isDeleting && setDeleteModalConversation(null)}
                disabled={isDeleting}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-neutral-600 mb-4">
                {locale === 'ka'
                  ? 'ნამდვილად გსურთ ამ მიმოწერის წაშლა? ეს მოქმედება შეუქცევადია და ყველა შეტყობინება წაიშლება.'
                  : 'Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently deleted.'}
              </p>

              {/* Conversation preview */}
              <div className="bg-neutral-50 rounded-xl p-4 flex items-center gap-3">
                <Avatar
                  src={deleteModalConversation.participant.avatar}
                  name={deleteModalConversation.participant.name}
                  size="md"
                  className="w-11 h-11"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 text-sm">
                    {deleteModalConversation.participant.name}
                  </p>
                  {deleteModalConversation.lastMessage && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {deleteModalConversation.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-5 border-t border-neutral-100 bg-neutral-50">
              <button
                onClick={() => setDeleteModalConversation(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {locale === 'ka' ? 'იშლება...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {locale === 'ka' ? 'წაშლა' : 'Delete'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main export with Suspense
export default function MessagesPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="min-h-screen bg-white flex flex-col">
          <Header />
          <HeaderSpacer />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }} />
          </div>
        </div>
      }>
        <MessagesPageContent />
      </Suspense>
    </AuthGuard>
  );
}
