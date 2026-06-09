'use client';

import Avatar from '@/components/common/Avatar';
import ImageLightbox from '@/components/common/ImageLightbox';
import SmartImage from '@/components/common/SmartImage';
import TimeAgo from '@/components/common/TimeAgo';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { isRecentlyActive } from '@/utils/onlinePresence';
import { Badge, CountBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { formatChatDateSeparator, formatMessageTime, Locale } from '@/utils/dateUtils';
import {
  ChevronRight,
  FileArchive,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useLanguage } from "@/contexts/LanguageContext";
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
  /**
   * The OTHER party's `lastLoginAt`. Drives a small "Active
   * recently" indicator in the chat header so a user can tell at
   * a glance whether they're messaging someone who was around in
   * the last 30 min vs. someone who logged in last week. Optional
   * - if the parent doesn't have it, the indicator stays hidden.
   */
  otherPartyLastLoginAt?: string | null;
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toDateString();
}

function getSenderId(senderId: string | { _id: string } | undefined | null): string {
  if (!senderId) return '';
  if (typeof senderId === 'string') return senderId;
  return senderId._id || '';
}

/**
 * Pick an icon + tint + uppercase type label from a file URL or
 * filename. Used in the chat attachment row so users can tell a
 * PDF from a spreadsheet from a zip at a glance instead of
 * squinting at the filename.
 */
function getFileTypeMeta(name: string): {
  Icon: typeof FileText;
  color: string;
  label: string;
} {
  const lower = name.toLowerCase();
  const ext = lower.split('.').pop()?.split('?')[0] ?? '';
  if (ext === 'pdf') {
    return { Icon: FileText, color: 'text-[var(--hm-error-500)]', label: 'PDF' };
  }
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv' || ext === 'numbers') {
    return { Icon: FileSpreadsheet, color: 'text-[var(--hm-success-500)]', label: ext.toUpperCase() };
  }
  if (ext === 'zip' || ext === 'rar' || ext === '7z') {
    return { Icon: FileArchive, color: 'text-[var(--hm-warning-500)]', label: ext.toUpperCase() };
  }
  if (ext === 'doc' || ext === 'docx' || ext === 'pages' || ext === 'rtf') {
    return { Icon: FileText, color: 'text-[var(--hm-info-500)]', label: ext.toUpperCase() };
  }
  if (ext === 'txt' || ext === 'md') {
    return { Icon: FileText, color: 'text-[var(--hm-fg-muted)]', label: ext.toUpperCase() };
  }
  return { Icon: FileText, color: 'text-[var(--hm-fg-muted)]', label: ext ? ext.toUpperCase() : 'FILE' };
}

export default function ProjectChat({ jobId, locale, isClient = false, otherPartyLastLoginAt }: ProjectChatProps) {
  const { user } = useAuth();

  const { t } = useLanguage();
  const toast = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Lightbox state. Holds the currently-viewed image URL and the
  // gallery of all images in the same message (so left/right arrows
  // flip through related attachments without closing).
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  // Pending image attachment - shown in the composer before send so
  // the user can confirm what they picked and add a caption. Local
  // object URL is revoked on unmount/clear so we don't leak memory.
  // Non-image files (PDFs, docs) skip this preview state and upload
  // immediately because there's nothing meaningful to preview.
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  // Drag-over indicator. Counts enter vs leave events because a
  // single drag generates nested events as the cursor crosses
  // child elements - a naive boolean would flicker.
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

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

  // Fetch unread count on mount. AbortController cancels the first
  // Strict Mode mount's request so the Network tab doesn't show a
  // duplicate `GET /unread-counts` per chat open in dev.
  useEffect(() => {
    const controller = new AbortController();
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get(`/jobs/projects/${jobId}/unread-counts`, {
          signal: controller.signal,
        });
        setUnreadCount(response.data.chat || 0);
      } catch (error) {
        if ((error as { name?: string })?.name === "CanceledError") return;
        if ((error as { code?: string })?.code === "ERR_CANCELED") return;
        console.error('Failed to fetch unread count:', error);
      }
    };
    fetchUnreadCount();
    return () => controller.abort();
  }, [jobId]);

  // Shared abort ref for fetchMessages. Called from mount AND from
  // socket-reconnect; either could fire while the other is in flight.
  // Cancelling the prior request avoids a Strict Mode double-mount or a
  // mount-then-reconnect race from clobbering setMessages out of order.
  const fetchMessagesAbortRef = useRef<AbortController | null>(null);
  const fetchMessages = async () => {
    fetchMessagesAbortRef.current?.abort();
    const controller = new AbortController();
    fetchMessagesAbortRef.current = controller;
    try {
      setIsLoadingMessages(true);
      const response = await api.get(`/jobs/projects/${jobId}/messages`, {
        signal: controller.signal,
      });
      setMessages(response.data.messages || []);
      messagesLoadedRef.current = true;
    } catch (error) {
      if ((error as { name?: string })?.name === 'CanceledError') return;
      if ((error as { code?: string })?.code === 'ERR_CANCELED') return;
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMessages(false);
      }
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

  const handleSendMessage = async (attachments?: string[], overrideContent?: string) => {
    // `overrideContent` lets quick-reply chips bypass the input
    // state entirely - without it, calling this right after
    // setNewMessage would use the stale closure value of
    // `newMessage` and send an empty message. Caller passes the
    // chip text directly.
    const messageContent = (overrideContent ?? newMessage).trim();
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

      // Replace temp message with real one. Race-safe: if the WS echo
      // landed before this REST response (network reorder), the real
      // message is already in `prev` - drop the temp instead of
      // mapping, so we don't end up with two entries sharing the same
      // real _id.
      if (response.data?.message) {
        const realMessage = response.data.message;
        setMessages(prev => {
          const realAlreadyPresent = prev.some(
            (m) => m._id === realMessage._id && m._id !== tempId,
          );
          if (realAlreadyPresent) {
            return prev.filter((m) => m._id !== tempId);
          }
          return prev.map((m) => (m._id === tempId ? realMessage : m));
        });
      }
    } catch (err) {
      // Rollback on error
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setNewMessage(messageContent);
      toast.error(
        t('common.error'),
        t('projects.failedToSendMessage')
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
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/quicktime',
    'video/webm',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const extension = '.' + file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
      return t('projects.supportedFormatsJpgPngGif');
    }

    if (file.size > maxSize) {
      return t('projects.fileSizeMustNotExceed');
    }

    return null;
  };

  // Process a single picked-or-dropped file. Shared between the
  // file-picker input change handler and the drag-drop drop handler.
  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(t('projects.invalidFile'), validationError);
      return;
    }

    // Image: queue as a pending attachment so the user can confirm
    // + add a caption before send. Without this, an accidental
    // tap on the wrong photo gets immediately uploaded with no way
    // to undo. Non-image files still fire-and-forget.
    if (file.type.startsWith('image/')) {
      // Revoke any previous preview URL we created before swapping
      // to a new one - prevents memory leaks on repeated picks.
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      setPendingImage({ file, previewUrl });
      // Focus the text input so the user can drop straight into a
      // caption without an extra tap.
      window.setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post('/upload', formData);
      const fileUrl = uploadResponse.data.url || uploadResponse.data.filename;
      await handleSendMessage([fileUrl]);
    } catch {
      toast.error(t('common.error'), t('projects.failedToUploadFile'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await processFile(file);
    } finally {
      e.target.value = '';
    }
  };

  // Drag-and-drop handlers. dragenter / dragleave fire as the cursor
  // crosses child elements; we use a counter so the overlay doesn't
  // flicker when the user drags over nested message bubbles. Only
  // engages when files are present in the dataTransfer payload -
  // text drags from other elements don't activate the drop-zone.
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingFile(true);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingFile(false);
  };
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Upload the queued image (if any) then send the message with
  // the resulting URL as an attachment. Used by both the Send button
  // and the Enter-key handler so behavior stays in lockstep.
  const sendWithPendingImage = async () => {
    if (!pendingImage) {
      await handleSendMessage();
      return;
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', pendingImage.file);
      const uploadResponse = await api.post('/upload', formData);
      const fileUrl = uploadResponse.data.url || uploadResponse.data.filename;
      await handleSendMessage([fileUrl]);
      // Tidy local preview state after a successful send.
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    } catch {
      toast.error(t('common.error'), t('projects.failedToUploadFile'));
    } finally {
      setIsUploading(false);
    }
  };

  const clearPendingImage = () => {
    if (!pendingImage) return;
    URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  // Revoke the pending preview URL on unmount so we don't leak
  // memory if the user navigates away mid-compose.
  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    };
    // We deliberately don't depend on `pendingImage` here - the
    // cleanup only needs to fire on the final unmount, not on every
    // pending-image swap (those are handled by `handleFileUpload`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always expanded - load messages on mount
  useEffect(() => {
    if (!messagesLoadedRef.current) {
      fetchMessages();
    }
    // Mount-only: messages are then driven by WebSocket events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      socket.emit('joinProjectChat', jobId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[ProjectChat] Disconnected:', reason);
    });

    // Refetch on reconnect so any messages sent while we were offline get
    // pulled in. Without this, the user's chat would be missing the
    // entire offline window until a manual refresh - WebSocket replay
    // doesn't cover messages that fired during the disconnect.
    socket.io.on('reconnect', () => {
      messagesLoadedRef.current = false;
      fetchMessages();
    });

    socket.on('projectMessage', (message: ProjectMessage) => {
      // Dedup by real Mongo _id. The own-tab's optimistic message uses
      // a `temp-` prefixed id that gets replaced with the real id in
      // the REST response handler, so by the time this WS echo arrives
      // the real id is already in `prev`. The previous code skipped
      // ALL own-sender messages, which broke the multi-tab case: if a
      // user had two tabs open and sent from tab A, tab B never saw
      // the message because it was dropped here. Dedup by id alone -
      // it's idempotent regardless of which path got there first.
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    // Typing indicator with a self-clearing watchdog. The other side may
    // close their tab or lose connection without ever emitting
    // `isTyping: false`, which used to leave us stuck on "typing..."
    // indefinitely. Every `true` schedules a 5s auto-clear that the next
    // `true` re-arms (so continuous typing stays visible) and any
    // subsequent `false` cancels.
    let typingClearTimer: ReturnType<typeof setTimeout> | null = null;
    socket.on('projectTyping', ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (userId === user.id) return;
      setOtherUserTyping(typing);
      if (typingClearTimer) {
        clearTimeout(typingClearTimer);
        typingClearTimer = null;
      }
      if (typing) {
        typingClearTimer = setTimeout(() => {
          setOtherUserTyping(false);
          typingClearTimer = null;
        }, 5000);
      }
    });

    return () => {
      if (typingClearTimer) clearTimeout(typingClearTimer);
      socket.emit('leaveProjectChat', jobId);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
    // The full `user` object isn't a dep - only `user.id` matters for
    // reconnecting; the socket closure reads `user` via ref-stable
    // references it captured at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, jobId]); // Only reconnect when user or job changes

  // Scroll to bottom when messages change - but ONLY if the user is
  // already near the bottom. Previously this yanked the user back to the
  // latest message every time a new one arrived, even while they were
  // scrolled up reading history. Threshold of 120px is forgiving enough
  // that "near bottom" includes the moment right after pressing Send.
  useEffect(() => {
    if (!messagesEndRef.current) return;
    const container = messagesEndRef.current.parentElement;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Marking messages as read is owned by the parent (JobDetailClient)
  // so the sidebar's unread badge state stays in sync with the actual
  // server write. The local `unreadCount` here is just the header
  // decoration - reset it to zero on mount since the user is now
  // looking at the chat; otherwise the badge would keep showing the
  // pre-open count forever.
  useEffect(() => {
    setUnreadCount(0);
  }, [jobId]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {/* Drop-zone overlay - visible only while a file drag is over
          the chat. Click-through disabled so the dragged file lands
          on our drop handler, not the underlying messages. */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--hm-brand-500)]/8 border-2 border-dashed border-[var(--hm-brand-500)] rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-6 py-4 bg-[var(--hm-bg-elevated)] rounded-xl shadow-lg">
            <Paperclip className="w-6 h-6 text-[var(--hm-brand-500)]" />
            <span className="text-sm font-medium text-[var(--hm-fg-primary)]">
              {t('projects.dropToAttach')}
            </span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="p-4 border-b border-[var(--hm-border-subtle)]">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--hm-fg-primary)] flex items-center gap-2 flex-wrap">
            <MessageSquare className="w-5 h-5 text-[var(--hm-brand-500)]" />
            {t('projects.projectChat')}
            <CountBadge count={unreadCount} />
            {/* "Active recently" indicator. lastLoginAt-based so
                this is a stale snapshot, not live presence - the
                copy intentionally says "recently" rather than
                "online now" to match the data fidelity. Hidden when
                the parent doesn't pass the field or it's outside
                the 30-min window. */}
            {isRecentlyActive(otherPartyLastLoginAt) && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--hm-success-500)]"
                title={t('presence.activeRecently')}
              >
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-[var(--hm-success-500)]"
                />
                {t('presence.activeRecently')}
              </span>
            )}
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSearchToggle}
            title={t('common.search')}
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
            <div className="flex-1">
              <Input
                ref={searchInputRef}
                type="text"
                variant="filled"
                inputSize="sm"
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
                placeholder={t('projects.searchMessages')}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            {searchQuery && (
              <span className="text-xs text-[var(--hm-fg-muted)] whitespace-nowrap">
                {searchResultCount > 0 ? `${currentSearchIndex + 1}/${searchResultCount}` : t('projects.0Results')}
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
        <div className="bg-[var(--hm-bg-tertiary)]/50 rounded-xl overflow-hidden">
          {/* Messages Area */}
          <div className="h-72 sm:h-80 overflow-y-auto p-4 space-y-3">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" color={ACCENT} />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--hm-fg-muted)]">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">{t('projects.noMessagesYet')}</p>
                <p className="text-xs mt-1">{t('projects.startTheConversation')}</p>
              </div>
            ) : searchQuery && filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--hm-fg-muted)]">
                <Search className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">{t('projects.noResultsFound')}</p>
                <p className="text-xs mt-1">{t('projects.tryADifferentSearchTerm')}</p>
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
                  // Render message body: URLs become clickable
                  // anchors, and any active search query gets the
                  // yellow highlight on top. Two-pass: split by URL
                  // first, then highlight inside each text chunk.
                  // URLs are conservative on purpose - we only match
                  // explicit `http(s)://` or `www.` prefixes so we
                  // don't accidentally link bare words like
                  // "user.name" that happen to look domain-ish.
                  const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

                  const highlightText = (chunk: string, keyPrefix: string) => {
                    if (!searchQuery.trim()) return chunk;
                    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const parts = chunk.split(regex);
                    return parts.map((part, i) =>
                      regex.test(part) ? (
                        <mark key={`${keyPrefix}-mark-${i}`} className="bg-yellow-300 text-inherit rounded px-0.5">
                          {part}
                        </mark>
                      ) : (
                        <span key={`${keyPrefix}-txt-${i}`}>{part}</span>
                      )
                    );
                  };

                  const highlightContent = (content: string) => {
                    const nodes: React.ReactNode[] = [];
                    let lastIndex = 0;
                    let match: RegExpExecArray | null;
                    const regex = new RegExp(URL_REGEX.source, URL_REGEX.flags);
                    let nodeIdx = 0;
                    while ((match = regex.exec(content)) !== null) {
                      const url = match[0];
                      const start = match.index;
                      if (start > lastIndex) {
                        nodes.push(
                          <span key={`t-${nodeIdx++}`}>{highlightText(content.slice(lastIndex, start), `t-${nodeIdx}`)}</span>,
                        );
                      }
                      // Strip trailing punctuation that's almost
                      // never part of the actual URL (sentence-end
                      // periods, commas, closing parens).
                      let trimmed = url;
                      while (/[.,;:)\]!?]$/.test(trimmed)) trimmed = trimmed.slice(0, -1);
                      const href = trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed;
                      nodes.push(
                        <a
                          key={`a-${nodeIdx++}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`underline underline-offset-2 break-all ${
                            isMine ? "text-white hover:text-white/90" : "text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-600)]"
                          }`}
                        >
                          {trimmed}
                        </a>,
                      );
                      // Preserve any stripped trailing punctuation.
                      if (trimmed.length < url.length) {
                        nodes.push(
                          <span key={`p-${nodeIdx++}`}>{url.slice(trimmed.length)}</span>,
                        );
                      }
                      lastIndex = start + url.length;
                    }
                    if (lastIndex < content.length) {
                      nodes.push(
                        <span key={`t-${nodeIdx++}`}>{highlightText(content.slice(lastIndex), `t-${nodeIdx}`)}</span>,
                      );
                    }
                    return nodes.length > 0 ? nodes : highlightText(content, "all");
                  };

                  return (
                    <div key={msg._id || idx}>
                      {/* Date Separator */}
                      {showDateSeparator && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-[var(--hm-bg-tertiary)]" />
                          <Badge variant="secondary" size="xs">
                            {formatChatDateSeparator(msg.createdAt, t, locale as Locale)}
                          </Badge>
                          <div className="flex-1 h-px bg-[var(--hm-bg-tertiary)]" />
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

                              // Build the gallery of every image
                              // attached to this same message so
                              // arrow-key nav inside the lightbox
                              // can flip between siblings.
                              const messageImages = (msg.attachments || [])
                                .filter((a) =>
                                  a.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                                  a.includes('/image/upload/') ||
                                  (a.includes('cloudinary') && !a.includes('/raw/')),
                                )
                                .map((a) => storage.getFileUrl(a));
                              const lightboxIndex = messageImages.indexOf(storage.getFileUrl(attachment));

                              return (
                                <div key={aIdx} className="mb-1">
                                  {isImage ? (
                                    <button
                                      type="button"
                                      onClick={() => setLightbox({ images: messageImages, index: lightboxIndex >= 0 ? lightboxIndex : 0 })}
                                      className="block rounded-xl overflow-hidden border border-[var(--hm-border)] hover:opacity-95 transition-opacity"
                                      aria-label="Open image"
                                    >
                                      <SmartImage
                                        src={storage.getFileUrl(attachment)}
                                        alt=""
                                        className="max-w-[200px] block cursor-zoom-in"
                                      />
                                    </button>
                                  ) : (
                                    (() => {
                                      const fileName = attachment.split("/").pop() ?? attachment;
                                      const meta = getFileTypeMeta(fileName);
                                      const FileIcon = meta.Icon;
                                      return (
                                        <a
                                          href={storage.getFileUrl(attachment)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2.5 px-3 py-2 min-w-0 bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] hover:bg-[var(--hm-bg-page)] transition-colors"
                                          title={fileName}
                                        >
                                          {/* Type-tinted square so the user can scan
                                              types at a glance instead of reading the
                                              filename. */}
                                          <span className={`flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--hm-bg-tertiary)] flex items-center justify-center ${meta.color}`}>
                                            <FileIcon className="w-4 h-4" />
                                          </span>
                                          <span className="flex-1 min-w-0">
                                            <span className="block text-xs font-medium truncate text-[var(--hm-fg-primary)]">
                                              {fileName}
                                            </span>
                                            <span className="block text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)] mt-0.5">
                                              {meta.label}
                                            </span>
                                          </span>
                                        </a>
                                      );
                                    })()
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
                                    : 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] rounded-bl-md border border-[var(--hm-border)]'
                                } ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
                                style={isMine ? { backgroundColor: ACCENT } : {}}
                              >
                                <p className="text-sm leading-relaxed">{highlightContent(msg.content)}</p>
                                {/* Timestamp inside the message bubble.
                                    Was `text-neutral-400` for received
                                    messages - hardcoded light-mode tone
                                    that read as a dim grey-blue on dark
                                    theme bubbles. Swapped to the muted
                                    foreground var which adapts. */}
                                <TimeAgo
                                  isoDate={msg.createdAt}
                                  variant="time"
                                  className={`block text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-[var(--hm-fg-muted)]'}`}
                                />
                              </div>
                            ) : msg.attachments?.length ? (
                              <TimeAgo
                                isoDate={msg.createdAt}
                                variant="time"
                                className="block text-[10px] text-[var(--hm-fg-muted)] mt-1"
                              />
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
                    <div className="flex gap-1 px-3 py-2 bg-[var(--hm-bg-elevated)] rounded-2xl rounded-bl-md border border-[var(--hm-border)]">
                      <span className="w-2 h-2 rounded-full animate-bounce bg-[var(--hm-brand-500)]" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce bg-[var(--hm-brand-500)]" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce bg-[var(--hm-brand-500)]" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
            {/* Quick-reply chips - shown only when the input is
                empty + no attachment pending, so they don't clutter
                a deliberate message. Tap sends immediately, skipping
                the input round-trip. Common acknowledgments users
                otherwise type by hand 5x a day during a project. */}
            {!newMessage.trim() && !pendingImage && !isSubmitting && !isUploading && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
                {[
                  t("projects.quickReplies.gotIt"),
                  t("projects.quickReplies.soundsGood"),
                  t("projects.quickReplies.thanks"),
                  t("projects.quickReplies.willDo"),
                  t("projects.quickReplies.onMyWay"),
                ].map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => {
                      // Send immediately via overrideContent so we
                      // don't have to round-trip through setState
                      // (which would close-capture the stale
                      // newMessage value). The optimistic + WS
                      // dedup logic in handleSendMessage handles
                      // the rest.
                      void handleSendMessage(undefined, reply);
                    }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-brand-500)]/10 hover:text-[var(--hm-brand-500)] transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            {/* Pending image preview - shown above the input row when
                the user has picked an image but not sent yet. Lets
                them confirm what they picked and write a caption
                first. X clears the queue without sending. */}
            {pendingImage && (
              <div className="mb-2 flex items-center gap-2">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Local object URL, no need for next/image optimization. */}
                  <img
                    src={pendingImage.previewUrl}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-[var(--hm-border)]"
                  />
                  <button
                    type="button"
                    onClick={clearPendingImage}
                    aria-label={t('common.remove')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--hm-n-900)] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-[var(--hm-fg-muted)] truncate flex-1">
                  {pendingImage.file.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* File Upload Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-full text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]"
              >
                {isUploading ? (
                  <LoadingSpinner size="sm" color="currentColor" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Text Input */}
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  variant="filled"
                  inputSize="sm"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    emitTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendWithPendingImage();
                    }
                  }}
                  placeholder={t('projects.typeAMessage')}
                  maxLength={4000}
                />
              </div>

              {/* Send Button - disables until there's either text or
                  a pending image so the user can send a
                  caption-less image attachment too. */}
              <Button
                type="button"
                size="icon-sm"
                onClick={(e) => {
                  e.preventDefault();
                  void sendWithPendingImage();
                }}
                disabled={(!newMessage.trim() && !pendingImage) || isSubmitting || isUploading}
                className="rounded-full bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox - rendered outside the chat scroller so the
          backdrop covers the entire viewport, not just the chat
          panel. Closed by setting `lightbox` back to null. */}
      {lightbox && (
        <ImageLightbox
          isOpen={!!lightbox}
          onClose={() => setLightbox(null)}
          images={lightbox.images}
          initialIndex={lightbox.index}
        />
      )}
    </div>
  );
}
