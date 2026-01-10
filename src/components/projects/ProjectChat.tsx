'use client';

import Avatar from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge, CountBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { formatChatDateSeparator, formatMessageTime, Locale } from '@/utils/dateUtils';
import {
  ChevronRight,
  FileText,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toDateString();
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
  const [unreadCount, setUnreadCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesLoadedRef = useRef(false);

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get(`/jobs/projects/${jobId}/unread-counts`);
        setUnreadCount(response.data.chat || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };
    fetchUnreadCount();
  }, [jobId]);

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
    const messageContent = newMessage.trim();
    const hasContent = messageContent.length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if ((!hasContent && !hasAttachments) || isSubmitting || !user) return;

    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    const optimisticMessage: ProjectMessage = {
      _id: tempId,
      senderId: user.id,
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
        content: messageContent || '', // Ensure content is at least empty string
        attachments: hasAttachments ? attachments : undefined,
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

  // Search functionality
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => msg.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const searchResultCount = filteredMessages.length;

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    setSearchQuery('');
    setCurrentSearchIndex(0);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResultCount === 0) return;
    if (direction === 'next') {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResultCount);
    } else {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResultCount) % searchResultCount);
    }
  };

  // Scroll to search result
  useEffect(() => {
    if (searchQuery && filteredMessages.length > 0 && currentSearchIndex < filteredMessages.length) {
      const messageId = filteredMessages[currentSearchIndex]._id;
      const element = document.getElementById(`msg-${messageId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSearchIndex, searchQuery, filteredMessages]);

  // Allowed file types for chat
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
      return locale === 'ka'
        ? 'მხარდაჭერილი ფორმატები: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT'
        : 'Supported formats: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT';
    }

    if (file.size > maxSize) {
      return locale === 'ka'
        ? 'ფაილის ზომა არ უნდა აღემატებოდეს 10MB-ს'
        : 'File size must not exceed 10MB';
    }

    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(
        locale === 'ka' ? 'არასწორი ფაილი' : 'Invalid file',
        validationError
      );
      e.target.value = '';
      return;
    }

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

  // Always expanded - load messages on mount
  useEffect(() => {
    if (!messagesLoadedRef.current) {
      fetchMessages();
    }
  }, []);

  // WebSocket connection - stable connection without callback dependencies
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const backendUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

    const socket = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[ProjectChat] Connected to WebSocket');
      socket.emit('joinProjectChat', jobId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[ProjectChat] Disconnected:', reason);
    });

    socket.on('projectMessage', (message: ProjectMessage) => {
      const senderId = getSenderId(message.senderId);
      if (senderId === user.id) return; // Skip own messages

      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('projectTyping', ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (userId !== user.id) {
        setOtherUserTyping(typing);
      }
    });

    return () => {
      socket.emit('leaveProjectChat', jobId);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, jobId]); // Only reconnect when user or job changes

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  // Mark messages as read on mount
  useEffect(() => {
    // Always mark as read when chat is viewed - the backend will handle if there's nothing to mark
    api.post(`/jobs/projects/${jobId}/messages/read`).catch(() => {});
    setUnreadCount(0);
  }, [jobId]);

  return (
    <div>
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" style={{ color: ACCENT }} />
            {locale === 'ka' ? 'პროექტის ჩატი' : 'Project Chat'}
            <CountBadge count={unreadCount} />
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSearchToggle}
            title={locale === 'ka' ? 'ძებნა' : 'Search'}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="p-4">
        {/* Search Bar (when open) */}
        {isSearchOpen && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentSearchIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigateSearch('next');
                  } else if (e.key === 'Escape') {
                    handleSearchToggle();
                  }
                }}
                placeholder={locale === 'ka' ? 'ძებნა შეტყობინებებში...' : 'Search messages...'}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]/50"
              />
            </div>
            {searchQuery && (
              <span className="text-xs text-neutral-500 whitespace-nowrap">
                {searchResultCount > 0 ? `${currentSearchIndex + 1}/${searchResultCount}` : locale === 'ka' ? '0 შედეგი' : '0 results'}
              </span>
            )}
            {searchQuery && searchResultCount > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateSearch('prev')}
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateSearch('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSearchToggle}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Messages Container */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl overflow-hidden">
          {/* Messages Area */}
          <div className="h-72 sm:h-80 overflow-y-auto p-4 space-y-3">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" color={ACCENT} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">{locale === 'ka' ? 'ჯერ არ არის შეტყობინება' : 'No messages yet'}</p>
                <p className="text-xs mt-1">{locale === 'ka' ? 'დაიწყე საუბარი' : 'Start the conversation'}</p>
              </div>
            ) : searchQuery && filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">{locale === 'ka' ? 'შედეგი ვერ მოიძებნა' : 'No results found'}</p>
                <p className="text-xs mt-1">{locale === 'ka' ? 'სცადე სხვა საძიებო სიტყვა' : 'Try a different search term'}</p>
              </div>
            ) : (
              <>
                {(searchQuery ? filteredMessages : messages).map((msg, idx, arr) => {
                  const senderId = getSenderId(msg.senderId);
                  const isMine = senderId === user?.id;
                  const senderName = msg.senderName || (typeof msg.senderId === 'object' ? msg.senderId.name : '');
                  const senderAvatar = msg.senderAvatar || (typeof msg.senderId === 'object' ? msg.senderId.avatar : undefined);
                  const isHighlighted = searchQuery && filteredMessages[currentSearchIndex]?._id === msg._id;

                  // Check if we need to show date separator
                  const currentDateKey = getDateKey(msg.createdAt);
                  const prevMessage = idx > 0 ? arr[idx - 1] : null;
                  const prevDateKey = prevMessage ? getDateKey(prevMessage.createdAt) : null;
                  const showDateSeparator = !searchQuery && (!prevDateKey || currentDateKey !== prevDateKey);

                  // Highlight search term in message content
                  const highlightContent = (content: string) => {
                    if (!searchQuery.trim()) return content;
                    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const parts = content.split(regex);
                    return parts.map((part, i) =>
                      regex.test(part) ? (
                        <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/50 text-inherit rounded px-0.5">
                          {part}
                        </mark>
                      ) : (
                        part
                      )
                    );
                  };

                  return (
                    <div key={msg._id || idx}>
                      {/* Date Separator */}
                      {showDateSeparator && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                          <Badge variant="secondary" size="xs">
                            {formatChatDateSeparator(msg.createdAt, locale as Locale)}
                          </Badge>
                          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                        </div>
                      )}
                      <div
                        id={`msg-${msg._id}`}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'animate-pulse' : ''}`}
                      >
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
                            {msg.attachments?.map((attachment, aIdx) => {
                              const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                                attachment.includes('/image/upload/') ||
                                (attachment.includes('cloudinary') && !attachment.includes('/raw/'));

                              return (
                                <div key={aIdx} className="mb-1">
                                  {isImage ? (
                                    <a href={storage.getFileUrl(attachment)} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={storage.getFileUrl(attachment)}
                                        alt=""
                                        className="max-w-[200px] rounded-xl border border-neutral-200 dark:border-neutral-700"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={storage.getFileUrl(attachment)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                    >
                                      <FileText className="w-4 h-4 text-neutral-400" />
                                      <span className="text-xs truncate max-w-[120px]">{attachment.split('/').pop()}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                            {/* Message Content */}
                            {msg.content ? (
                              <div
                                className={`px-3.5 py-2 rounded-2xl transition-all ${
                                  isMine
                                    ? 'rounded-br-md text-white'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-md border border-neutral-200 dark:border-neutral-700'
                                } ${isHighlighted ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''}`}
                                style={isMine ? { backgroundColor: ACCENT } : {}}
                              >
                                <p className="text-sm leading-relaxed">{highlightContent(msg.content)}</p>
                                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-neutral-400'}`}>
                                  {formatMessageTime(msg.createdAt)}
                                </p>
                              </div>
                            ) : msg.attachments?.length ? (
                              <p className="text-[10px] text-neutral-400 mt-1">
                                {formatMessageTime(msg.createdAt)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Typing indicator */}
                {otherUserTyping && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 px-3 py-2 bg-white dark:bg-neutral-800 rounded-2xl rounded-bl-md border border-neutral-200 dark:border-neutral-700">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: ACCENT, animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: ACCENT, animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: ACCENT, animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <LoadingSpinner size="sm" color="currentColor" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
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
                className="flex-1 px-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]/50 focus:ring-2 focus:ring-[#C4735B]/10 transition-all"
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
    </div>
  );
}
