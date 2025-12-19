'use client';

import Avatar from '@/components/common/Avatar';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Edit3,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Search,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Terracotta accent color matching the app
const ACCENT_COLOR = '#C4735B';

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
  locale,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  locale: string;
}) {
  const { participant, lastMessage, unreadCount } = conversation;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 text-left transition-all duration-200 border-l-2 ${
        isSelected
          ? 'bg-[#FDF8F6] border-l-[#C4735B]'
          : 'border-l-transparent hover:bg-neutral-50'
      }`}
    >
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
                isMine ? 'border-[#C4735B]/30 bg-[#FDF5F0]' : 'border-neutral-200 bg-white'
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
                  ? 'bg-[#C4735B] text-white rounded-br-md'
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
            ? 'bg-[#C4735B] text-white rounded-br-md'
            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md'
        }`}
      >
        <p className="text-[15px] leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

// Main Messages Page Content Component
function MessagesPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get conversation ID from URL if present
  const urlConversationId = searchParams.get('conversation');
  const urlRecipientId = searchParams.get('recipient');

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('token');
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

    socketRef.current.on('newMessage', (message: Message) => {
      // Add new message to the list if it's for the current conversation
      setMessages(prev => {
        // Avoid duplicates (from optimistic updates)
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
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

    socketRef.current.on('userTyping', ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (userId !== user?.id) {
        setOtherUserTyping(typing);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, user]);

  // Join/leave conversation room when selected conversation changes
  useEffect(() => {
    if (!socketRef.current || !selectedConversation) return;

    socketRef.current.emit('joinConversation', selectedConversation._id);

    return () => {
      if (socketRef.current && selectedConversation) {
        socketRef.current.emit('leaveConversation', selectedConversation._id);
      }
    };
  }, [selectedConversation]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !selectedConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { conversationId: selectedConversation._id, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current && selectedConversation) {
        socketRef.current.emit('typing', { conversationId: selectedConversation._id, isTyping: false });
      }
    }, 2000);
  }, [selectedConversation, isTyping]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await api.get('/conversations');
      setConversations(response.data);

      // If URL has conversation ID, select it
      if (urlConversationId) {
        const conv = response.data.find((c: Conversation) => c._id === urlConversationId);
        if (conv) {
          setSelectedConversation(conv);
          setIsMobileListOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, urlConversationId]);

  // Start new conversation if recipient ID is in URL
  useEffect(() => {
    const startNewConversation = async () => {
      if (!urlRecipientId || !isAuthenticated || isLoading) return;

      try {
        const response = await api.post('/conversations/start', {
          recipientId: urlRecipientId,
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
          // Update URL
          window.history.replaceState({}, '', `/messages?conversation=${conversation._id}`);
        }
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    startNewConversation();
  }, [urlRecipientId, isAuthenticated, isLoading]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(response.data);

      // Mark messages as read
      try {
        await api.patch(`/messages/conversation/${conversationId}/read-all`);
        await api.patch(`/conversations/${conversationId}/read`);
      } catch (e) {
        // Ignore read errors
      }

      // Update local conversation unread count
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.participant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistically add message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: user?.id || '',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await api.post('/messages', {
        conversationId: selectedConversation._id,
        content: messageContent,
      });

      // Replace temp message with real one
      setMessages(prev =>
        prev.map(m => (m._id === tempMessage._id ? response.data : m))
      );

      // Update conversation's last message
      setConversations(prev =>
        prev.map(c =>
          c._id === selectedConversation._id
            ? {
                ...c,
                lastMessage: {
                  content: messageContent,
                  createdAt: new Date().toISOString(),
                  senderId: user?.id || '',
                },
              }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(messageContent); // Restore message
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Send message with attachment
      const response = await api.post('/messages', {
        conversationId: selectedConversation._id,
        content: '',
        attachments: [uploadResponse.data.url || uploadResponse.data.filename],
      });

      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }

    e.target.value = '';
  };

  // Select conversation
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsMobileListOpen(false);
    // Update URL without navigation
    window.history.replaceState({}, '', `/messages?conversation=${conv._id}`);
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
                      {selectedConversation.participant.role === 'pro' && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: '#E8956A', color: 'white' }}
                        >
                          PRO
                        </span>
                      )}
                      {selectedConversation.participant.title && (
                        <span className="text-neutral-500">
                          {selectedConversation.participant.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={
                      selectedConversation.participant.role === 'pro'
                        ? `/professionals/${selectedConversation.participant.proProfileId || selectedConversation.participant._id}`
                        : `/users/${selectedConversation.participant._id}`
                    }
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
                        {/* Date Divider */}
                        <div className="flex items-center justify-center mb-6">
                          <span className="px-3 py-1 bg-neutral-200/60 rounded-full text-xs font-medium text-neutral-500">
                            {formatDateDivider(msgs[0].createdAt, locale)}
                          </span>
                        </div>

                        {/* Messages */}
                        <div className="space-y-3">
                          {msgs.map((message, idx) => {
                            const senderId = getSenderId(message.senderId);
                            const isMine = senderId === user?.id;
                            const showAvatar =
                              !isMine &&
                              (idx === 0 || getSenderId(msgs[idx - 1].senderId) === user?.id);

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

                    <div ref={messagesEndRef} />

                    {/* Typing indicator */}
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
            </>
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
    </div>
  );
}

// Main export with Suspense
export default function MessagesPage() {
  return (
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
  );
}
