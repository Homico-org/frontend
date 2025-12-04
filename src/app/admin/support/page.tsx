'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/common/Header';

interface SupportMessage {
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  isAdmin: boolean;
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

export default function AdminSupportPage() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

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

  const sendMessage = async () => {
    if (!token || !selectedTicket || !inputValue.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: inputValue }),
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
        setInputValue('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'closed': return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/20 dark:text-neutral-400';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-blue-600 dark:text-blue-400';
      case 'low': return 'text-neutral-500 dark:text-neutral-400';
      default: return 'text-neutral-500';
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Header />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('admin.supportPage.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('admin.supportPage.subtitle')}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: t('admin.reportsPage.totalReports'), value: stats.total, color: 'bg-neutral-500' },
              { label: t('admin.open'), value: stats.open, color: 'bg-amber-500' },
              { label: t('admin.supportPage.inProgress'), value: stats.inProgress, color: 'bg-blue-500' },
              { label: t('admin.resolved'), value: stats.resolved, color: 'bg-emerald-500' },
              { label: t('admin.unread'), value: stats.unread, color: 'bg-red-500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3 sm:p-4 rounded-xl"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</span>
                </div>
                <p className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div
          className="rounded-xl overflow-hidden flex flex-col lg:flex-row"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-subtle)',
            minHeight: 'calc(100vh - 320px)',
          }}
        >
          {/* Tickets List */}
          <div
            className={`${selectedTicket ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[360px] border-r`}
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            {/* Filter Tabs */}
            <div className="flex-shrink-0 p-3 border-b overflow-x-auto" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex gap-1 min-w-max">
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as StatusFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      statusFilter === filter
                        ? 'bg-emerald-500 text-white'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    style={statusFilter !== filter ? { color: 'var(--color-text-secondary)' } : {}}
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
                  <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-text-primary)' }} />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{t('admin.supportPage.noTicketsFound')}</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  {tickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      onClick={() => selectTicket(ticket)}
                      className={`w-full p-3 sm:p-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                        selectedTicket?._id === ticket._id ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {ticket.userId.avatar ? (
                            <img src={ticket.userId.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                              style={{ backgroundColor: '#22543d' }}
                            >
                              {ticket.userId.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {ticket.hasUnreadUserMessages && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {ticket.userId.name}
                            </p>
                            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                              {formatDate(ticket.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-xs truncate mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                            {ticket.subject}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className={`text-[10px] font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedTicket ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div
                  className="flex-shrink-0 p-3 sm:p-4 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                      <svg className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {selectedTicket.userId.name}
                        </p>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                          {selectedTicket.userId.role}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {selectedTicket.userId.email} · {getCategoryLabel(selectedTicket.category)}
                      </p>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(selectedTicket._id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Subject Banner */}
                <div
                  className="flex-shrink-0 px-3 sm:px-4 py-2 border-b"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-subtle)' }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedTicket.subject}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2.5 ${
                          msg.isAdmin
                            ? 'rounded-2xl rounded-br-md'
                            : 'rounded-2xl rounded-bl-md'
                        }`}
                        style={{
                          backgroundColor: msg.isAdmin ? '#22543d' : 'var(--color-bg-primary)',
                          color: msg.isAdmin ? 'white' : 'var(--color-text-primary)',
                          border: msg.isAdmin ? 'none' : '1px solid var(--color-border-subtle)',
                        }}
                      >
                        {!msg.isAdmin && (
                          <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mb-1">
                            {selectedTicket.userId.name}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.isAdmin ? 'text-white/60' : 'text-neutral-400'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {selectedTicket.status !== 'closed' && (
                  <div
                    className="flex-shrink-0 p-3 sm:p-4 border-t"
                    style={{ borderColor: 'var(--color-border-subtle)' }}
                  >
                    <div className="flex gap-2">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type your response..."
                        rows={1}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          minHeight: '44px',
                          maxHeight: '120px',
                        }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isSending}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #22543d 0%, #38855e 100%)' }}
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Select a conversation
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Choose a ticket from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
