'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import Select from '@/components/common/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  RefreshCw,
  Search,
  XCircle,
  Inbox,
} from 'lucide-react';
import { formatDateRelative, formatMessageTime } from '@/utils/dateUtils';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { getAdminTicketStatusColor } from '@/utils/statusUtils';

type SupportMessageStatus = 'sent' | 'delivered' | 'read';

interface SupportMessage {
  _id?: string;
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  isAdmin: boolean;
  status?: SupportMessageStatus;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: SupportMessage[];
  hasUnreadUserMessages: boolean;
  lastMessageAt: string;
  createdAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  unread: number;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

function AdminSupportPageContent() {
  const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTicketIdRef = useRef<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // WebSocket connection setup
  useEffect(() => {
    if (!token || user?.role !== 'admin') return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

    socketRef.current = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Admin connected to support WebSocket');
      // Join admin support room for ticket updates
      socketRef.current?.emi"joinAdminSupport";
    });

    socketRef.current.on('disconnect', () => {
      console.log('Admin disconnected from support WebSocket');
    });

    // Handle new tickets
    socketRef.current.on('supportNewTicket', (ticket: SupportTicket) => {
      setTickets(prev => [ticket, ...prev]);
      setStats(prev => prev ? {
        ...prev,
        total: prev.total + 1,
        open: prev.open + 1,
        unread: prev.unread + 1,
      } : null);
    });

    // Handle ticket updates (new messages, status changes)
    socketRef.current.on('supportTicketUpdate', ({ ticketId, ticket }: { ticketId: string; ticket: SupportTicket }) => {
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, ...ticket } : t));
      setSelectedTicket(prev => prev?._id === ticketId ? { ...prev, ...ticket } : prev);
    });

    // Handle new messages in real-time
    socketRef.current.on('supportNewMessage', ({ ticketId, message }: { ticketId: string; message: SupportMessage }) => {
      // Skip if it's our own message (already added optimistically)
      if (message.isAdmin) return;

      setSelectedTicket(prev => {
        if (prev?._id !== ticketId) return prev;
        // Check if message already exists
        if (prev.messages.some(m => m._id === message._id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
        };
      });

      // Update ticket in list
      setTickets(prev => prev.map(t => {
        if (t._id !== ticketId) return t;
        return {
          ...t,
          hasUnreadUserMessages: true,
          lastMessageAt: message.createdAt,
        };
      }));
    });

    // Handle message status updates
    socketRef.current.on('supportMessageStatusUpdate', ({ ticketId, messageIds, status }: { ticketId: string; messageIds: string[]; status: SupportMessageStatus }) => {
      setSelectedTicket(prev => {
        if (prev?._id !== ticketId) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg._id && messageIds.includes(msg._id) ? { ...msg, status } : msg
          ),
        };
      });
    });

    // Handle typing indicator
    socketRef.current.on('supportUserTyping', ({ isTyping: typing, isAdmin }: { odliserId: string; isAdmin: boolean; isTyping: boolean }) => {
      // Only show typing indicator for non-admin users
      if (!isAdmin) {
        setOtherUserTyping(typing);
      }
    });

    // Handle ticket status changes
    socketRef.current.on('supportTicketStatusChange', ({ ticketId, status, ticket }: { ticketId: string; status: string; ticket: SupportTicket }) => {
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: status as SupportTicket['status'] } : t));
      setSelectedTicket(prev => prev?._id === ticketId ? { ...prev, status: status as SupportTicket['status'] } : prev);
    });

    return () => {
      socketRef.current?.emi"leaveAdminSupport";
      socketRef.current?.disconnect();
    };
  }, [token, user?.role]);

  // Join/leave ticket room when selected ticket changes
  useEffect(() => {
    if (!socketRef.current) return;

    // Leave previous ticket room
    if (previousTicketIdRef.current) {
      socketRef.current.emit('leaveSupportTicket', previousTicketIdRef.current);
    }

    // Join new ticket room
    if (selectedTicket?._id) {
      socketRef.current.emit('joinSupportTicket', selectedTicket._id);
      previousTicketIdRef.current = selectedTicket._id;

      // Mark as delivered when viewing
      fetch(`${API_URL}/support/tickets/${selectedTicket._id}/delivered`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    return () => {
      if (previousTicketIdRef.current && socketRef.current) {
        socketRef.current.emit('leaveSupportTicket', previousTicketIdRef.current);
      }
    };
  }, [selectedTicket?._id, API_URL, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchTickets();
      fetchStats();
    }
  }, [token, user, statusFilter]);

  const fetchTickets = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_URL}/support/admin/tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/support/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const selectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setOtherUserTyping(false); // Reset typing indicator when switching tickets
    // Mark as read
    if (ticket.hasUnreadUserMessages) {
      try {
        await fetch(`${API_URL}/support/tickets/${ticket._id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        // Update local state
        setTickets(prev => prev.map(t =>
          t._id === ticket._id ? { ...t, hasUnreadUserMessages: false } : t
        ));
        setSelectedTicket(prev => prev ? { ...prev, hasUnreadUserMessages: false } : null);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !selectedTicket) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('supportTyping', { ticketId: selectedTicket._id, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current && selectedTicket) {
        socketRef.current.emit('supportTyping', { ticketId: selectedTicket._id, isTyping: false });
      }
    }, 2000);
  }, [selectedTicket, isTyping]);

  const sendMessage = async () => {
    if (!token || !selectedTicket || !inputValue.trim()) return;

    const messageContent = inputValue.trim();
    const tempId = `temp-${Date.now()}`;

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    if (socketRef.current) {
      socketRef.current.emit('supportTyping', { ticketId: selectedTicket._id, isTyping: false });
    }

    // Optimistic update
    const tempMessage: SupportMessage = {
      _id: tempId,
      senderId: { _id: user?.id || '', name: user?.name || 'Admin', avatar: user?.avatar },
      content: messageContent,
      isAdmin: true,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    setSelectedTicket(prev => prev ? {
      ...prev,
      messages: [...prev.messages, tempMessage],
    } : null);
    setInputValue('');
    setIsSending(true);

    try {
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageContent }),
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        // Replace temp message with real message from server
        setSelectedTicket(prev => {
          if (!prev) return null;
          const messagesWithoutTemp = prev.messages.filter(m => m._id !== tempId);
          return {
            ...updatedTicket,
            messages: [...messagesWithoutTemp, updatedTicket.messages[updatedTicket.messages.length - 1]],
          };
        });
        setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      } else {
        // Remove optimistic message on error
        setSelectedTicket(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(m => m._id !== tempId),
        } : null);
        setInputValue(messageContent);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setSelectedTicket(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m._id !== tempId),
      } : null);
      setInputValue(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const updateStatus = async (ticketId: string, status: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/support/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setTickets(prev => prev.map(t => t._id === ticketId ? updatedTicket : t));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(updatedTicket);
        }
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusColor = (status: string) => getAdminTicketStatusColor(status);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return THEME.error;
      case 'high': return '#F97316';
      case 'medium': return THEME.info;
      case 'low': return THEME.textDim;
      default: return THEME.textDim;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      account: 'Account & Profile',
      payment: 'Payments & Billing',
      job: 'Jobs & Projects',
      technical: 'Technical Issues',
      other: 'Other',
    };
    return labels[category] || category;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>Loading...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: t("admin.totalReports"), value: stats?.total || 0, icon: Inbox, color: THEME.primary },
    { label: t('common.open'), value: stats?.open || 0, icon: Clock, color: THEME.warning },
    { label: t('common.inProgress'), value: stats?.inProgress || 0, icon: MessageSquare, color: THEME.info },
    { label: t('admin.resolved'), value: stats?.resolved || 0, icon: CheckCircle, color: THEME.success },
    { label: t('admin.unread'), value: stats?.unread || 0, icon: AlertTriangle, color: THEME.error },
  ];

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: `${THEME.surface}E6`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </button>
              <div>
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: THEME.text, fontFamily: "'Inter', sans-serif" }}
                >
                  {t('common.title')}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: THEME.textMuted }}>
                  {t("admin.supportTickets")}
                </p>
              </div>
            </div>

            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                color: 'white',
                boxShadow: `0 4px 16px ${THEME.primary}40`,
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p
                    className="text-xl font-bold tracking-tight"
                    style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: THEME.textMuted }}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col lg:flex-row"
          style={{
            background: THEME.surfaceLight,
            border: `1px solid ${THEME.border}`,
            minHeight: 'calc(100vh - 280px)',
          }}
        >
          {/* Tickets List */}
          <div
            className={`${selectedTicket ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[360px]`}
            style={{ borderRight: `1px solid ${THEME.border}` }}
          >
            {/* Filter Tabs */}
            <div className="flex-shrink-0 p-3 overflow-x-auto" style={{ borderBottom: `1px solid ${THEME.border}` }}>
              <div className="flex gap-1 min-w-max">
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as StatusFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                    style={statusFilter === filter
                      ? { background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`, color: 'white' }
                      : { color: THEME.textMuted, background: 'transparent' }
                    }
                    onMouseEnter={(e) => {
                      if (statusFilter !== filter) {
                        e.currentTarget.style.background = THEME.surfaceHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (statusFilter !== filter) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" color={THEME.primary} />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.textDim }} />
                  <p className="text-sm" style={{ color: THEME.textMuted }}>{t("common.noResults")}</p>
                </div>
              ) : (
                <div>
                  {tickets.map((ticket, index) => {
                    const statusStyle = getStatusColor(ticket.status);
                    return (
                      <button
                        key={ticket._id}
                        onClick={() => selectTicket(ticket)}
                        className="w-full p-4 text-left transition-colors"
                        style={{
                          background: selectedTicket?._id === ticket._id ? `${THEME.primary}15` : 'transparent',
                          borderBottom: index < tickets.length - 1 ? `1px solid ${THEME.border}` : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTicket?._id !== ticket._id) {
                            e.currentTarget.style.background = THEME.surfaceHover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTicket?._id !== ticket._id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <Avatar src={ticket.userId?.avatar} name={ticket.userId?.name || 'User'} size="md" />
                            {ticket.hasUnreadUserMessages && (
                              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: THEME.error, border: `2px solid ${THEME.surfaceLight}` }} />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                                {ticket.userId?.name}
                              </p>
                              <span className="text-[10px] flex-shrink-0" style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatDateRelative(ticket.lastMessageAt)}
                              </span>
                            </div>
                            <p className="text-xs truncate mb-1.5" style={{ color: THEME.textMuted }}>
                              {ticket.subject}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{ background: statusStyle.bg, color: statusStyle.color }}
                              >
                                {ticket.status.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-medium" style={{ color: getPriorityColor(ticket.priority) }}>
                                {ticket.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedTicket ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-h-0`}>
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div
                  className="flex-shrink-0 p-4 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${THEME.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <ArrowLeft className="w-4 h-4" style={{ color: THEME.textMuted }} />
                    </button>
                    <Avatar src={selectedTicket.userId?.avatar} name={selectedTicket.userId?.name || 'User'} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm" style={{ color: THEME.text }}>
                          {selectedTicket.userId?.name}
                        </p>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: `${THEME.info}20`, color: THEME.info }}
                        >
                          {selectedTicket.userId?.role}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: THEME.textDim }}>
                        {selectedTicket.userId?.email} · {getCategoryLabel(selectedTicket.category)}
                      </p>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <Select
                    value={selectedTicket.status}
                    onChange={(value) => updateStatus(selectedTicket._id, value)}
                    size="sm"
                    options={[
                      { value: 'open', label: 'Open' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'closed', label: 'Closed' },
                    ]}
                  />
                </div>

                {/* Subject Banner */}
                <div
                  className="flex-shrink-0 px-4 py-2"
                  style={{ background: THEME.surface, borderBottom: `1px solid ${THEME.border}` }}
                >
                  <p className="text-xs font-medium" style={{ color: THEME.textMuted }}>
                    {selectedTicket.subject}
                  </p>
                </div>

                {/* Messages - Scrollable Container */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  style={{
                    minHeight: 0,
                    maxHeight: 'calc(100vh - 480px)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${THEME.border} transparent`,
                  }}
                >
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2.5 ${
                          msg.isAdmin
                            ? 'rounded-2xl rounded-br-md'
                            : 'rounded-2xl rounded-bl-md'
                        }`}
                        style={{
                          background: msg.isAdmin
                            ? `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`
                            : THEME.surface,
                          color: msg.isAdmin ? 'white' : THEME.text,
                          border: msg.isAdmin ? 'none' : `1px solid ${THEME.border}`,
                        }}
                      >
                        {!msg.isAdmin && (
                          <p className="text-[10px] font-medium mb-1" style={{ color: THEME.info }}>
                            {selectedTicket.userId?.name}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span
                            className="text-[10px]"
                            style={{
                              color: msg.isAdmin ? 'rgba(255,255,255,0.6)' : THEME.textDim,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {msg.isAdmin && msg.status && (
                            <span className="inline-flex items-center">
                              {msg.status === 'sent' && (
                                <svg className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              {msg.status === 'delivered' && (
                                <svg className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="18 6 7 17 2 12" />
                                  <polyline points="22 6 11 17 9 15" />
                                </svg>
                              )}
                              {msg.status === 'read' && (
                                <svg className="w-3.5 h-3.5" style={{ color: '#60D4F7' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="18 6 7 17 2 12" />
                                  <polyline points="22 6 11 17 9 15" />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Typing Indicator */}
                  {otherUserTyping && (
                    <div className="flex justify-start">
                      <div
                        className="flex gap-1 px-4 py-2.5 rounded-2xl rounded-bl-md"
                        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                      >
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: THEME.textDim, animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: THEME.textDim, animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: THEME.textDim, animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {selectedTicket.status !== 'closed' && (
                  <div
                    className="flex-shrink-0 p-4"
                    style={{ borderTop: `1px solid ${THEME.border}` }}
                  >
                    <div className="flex gap-2">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type your response..."
                        rows={1}
                        className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none resize-none transition-all"
                        style={{
                          background: THEME.surface,
                          border: `1px solid ${THEME.border}`,
                          color: THEME.text,
                          minHeight: '48px',
                          maxHeight: '120px',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = THEME.primary}
                        onBlur={(e) => e.currentTarget.style.borderColor = THEME.border}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isSending}
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        style={{
                          background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                          boxShadow: `0 4px 12px ${THEME.primary}40`,
                        }}
                      >
                        <Send className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ background: THEME.surface }}>
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${THEME.primary}20` }}
                  >
                    <MessageSquare className="w-8 h-8" style={{ color: THEME.primary }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: THEME.text }}>
                    Select a conversation
                  </p>
                  <p className="text-xs mt-1" style={{ color: THEME.textDim }}>
                    Choose a ticket from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminSupportPageContent />
    </AuthGuard>
  );
}
