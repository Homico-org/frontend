'use client';

import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  ChevronRight,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const ACCENT = '#C4735B';

interface ProjectMessage {
  _id?: string;
  senderId: string | { _id: string; name: string; avatar?: string };
  senderName?: string;
  senderAvatar?: string;
  senderRole?: 'client' | 'pro';
  content: string;
  attachments?: string[];
  createdAt: string;
}

interface ProjectChatProps {
  jobId: string;
  locale: string;
  isClient?: boolean;
}

function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ka') {
    if (diffMins < 60) return `${diffMins} წუთის წინ`;
    if (diffHours < 24) return `${diffHours} საათის წინ`;
    return `${diffDays} დღის წინ`;
  }

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getSenderId(senderId: string | { _id: string } | undefined | null): string {
  if (!senderId) return '';
  if (typeof senderId === 'string') return senderId;
  return senderId._id || '';
}

export default function ProjectChat({ jobId, locale, isClient = false }: ProjectChatProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesLoadedRef = useRef(false);

  // Fetch messages when expanded
  useEffect(() => {
    if (isExpanded && !messagesLoadedRef.current) {
      fetchMessages();
    }
  }, [isExpanded]);

  // WebSocket connection
  useEffect(() => {
    if (!isExpanded || !user) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const backendUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

    socketRef.current = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      console.log('[ProjectChat] Connected to WebSocket');
      socketRef.current?.emit('joinProjectChat', jobId);
    });

    socketRef.current.on('projectMessage', handleNewMessage);
    socketRef.current.on('projectTyping', handleTyping);

    return () => {
      socketRef.current?.emit('leaveProjectChat', jobId);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isExpanded, user, jobId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const response = await api.get(`/jobs/projects/${jobId}/messages`);
      setMessages(response.data.messages || []);
      messagesLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewMessage = useCallback((message: ProjectMessage) => {
    const senderId = getSenderId(message.senderId);
    if (senderId === user?._id) return; // Skip own messages

    setMessages(prev => {
      if (prev.some(m => m._id === message._id)) return prev;
      return [...prev, message];
    });
  }, [user?._id]);

  const handleTyping = useCallback(({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
    if (userId !== user?._id) {
      setOtherUserTyping(typing);
    }
  }, [user?._id]);

  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('projectTyping', { jobId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('projectTyping', { jobId, isTyping: false });
    }, 2000);
  }, [jobId, isTyping]);

  const handleSendMessage = async (attachments?: string[]) => {
    if ((!newMessage.trim() && !attachments?.length) || isSubmitting || !user) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    const optimisticMessage: ProjectMessage = {
      _id: tempId,
      senderId: user._id,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderRole: isClient ? 'client' : 'pro',
      content: messageContent,
      attachments,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      setIsSubmitting(true);
      const response = await api.post(`/jobs/projects/${jobId}/messages`, {
        content: messageContent,
        attachments,
      });

      // Replace temp message with real one
      if (response.data?.message) {
        setMessages(prev => prev.map(m => m._id === tempId ? response.data.message : m));
      }
    } catch (err) {
      // Rollback on error
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setNewMessage(messageContent);
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'შეტყობინება ვერ გაიგზავნა' : 'Failed to send message'
      );
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post('/upload', formData);
      const fileUrl = uploadResponse.data.url || uploadResponse.data.filename;

      // Send message with attachment
      await handleSendMessage([fileUrl]);
    } catch (err) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'ფაილი ვერ აიტვირთა' : 'Failed to upload file'
      );
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="border-t border-[var(--color-border)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${ACCENT}15` }}>
            <MessageSquare className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-sm font-semibold" style={{ color: ACCENT }}>
              {locale === 'ka' ? 'პროექტის ჩატი' : 'Project Chat'}
            </span>
            {messages.length > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                {messages.length}
              </span>
            )}
          </div>
          {messages.length > 0 && (
            <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:inline">
              {locale === 'ka' ? 'ბოლო:' : 'Last:'} {formatRelativeTime(messages[messages.length - 1].createdAt, locale)}
            </span>
          )}
        </div>
        <ChevronRight
          className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded Chat */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          {/* Messages Container */}
          <div className="bg-[var(--color-bg-tertiary)]/50 rounded-2xl overflow-hidden">
            {/* Messages Area */}
            <div className="h-64 sm:h-80 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-tertiary)]">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">{locale === 'ka' ? 'ჯერ არ არის შეტყობინება' : 'No messages yet'}</p>
                  <p className="text-xs mt-1">{locale === 'ka' ? 'დაიწყე საუბარი' : 'Start the conversation'}</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const senderId = getSenderId(msg.senderId);
                    const isMine = senderId === user?._id;
                    const senderName = msg.senderName || (typeof msg.senderId === 'object' ? msg.senderId.name : '');
                    const senderAvatar = msg.senderAvatar || (typeof msg.senderId === 'object' ? msg.senderId.avatar : undefined);

                    return (
                      <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
                          {!isMine && (
                            <Avatar
                              src={senderAvatar}
                              name={senderName}
                              size="sm"
                              className="w-7 h-7 flex-shrink-0"
                            />
                          )}
                          <div>
                            {/* Attachments */}
                            {msg.attachments?.map((attachment, aIdx) => (
                              <div key={aIdx} className="mb-1">
                                {attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <a href={storage.getFileUrl(attachment)} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={storage.getFileUrl(attachment)}
                                      alt=""
                                      className="max-w-[200px] rounded-xl border border-[var(--color-border)]"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={storage.getFileUrl(attachment)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                  >
                                    <FileText className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                                    <span className="text-xs truncate max-w-[120px]">{attachment.split('/').pop()}</span>
                                  </a>
                                )}
                              </div>
                            ))}
                            {/* Message Content */}
                            {msg.content && (
                              <div
                                className={`px-3.5 py-2 rounded-2xl ${
                                  isMine
                                    ? 'rounded-br-md text-white'
                                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] rounded-bl-md border border-[var(--color-border)]'
                                }`}
                                style={isMine ? { backgroundColor: ACCENT } : {}}
                              >
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-[var(--color-text-tertiary)]'}`}>
                                  {formatMessageTime(msg.createdAt)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {otherUserTyping && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 px-3 py-2 bg-[var(--color-bg-elevated)] rounded-2xl rounded-bl-md border border-[var(--color-border)]">
                        <span className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[var(--color-text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <div className="flex items-center gap-2">
                {/* File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-[var(--color-text-tertiary)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    emitTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={locale === 'ka' ? 'დაწერე შეტყობინება...' : 'Type a message...'}
                  className="flex-1 px-4 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-full text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#C4735B]/30 focus:ring-2 focus:ring-[#C4735B]/10 transition-all"
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  disabled={!newMessage.trim() || isSubmitting}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
