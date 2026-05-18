'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateLong, formatMessageTime } from '@/utils/dateUtils';
import { AlertTriangle, ArrowLeft, Send, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
  };
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: SupportMessage[];
  hasUnreadAdminMessages?: boolean;
  createdAt: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { isAuthenticated, token, user, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const ticketId = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal(`/help/ticket/${ticketId}`);
    }
  }, [authLoading, isAuthenticated, ticketId, openLoginModal]);

  useEffect(() => {
    if (token && ticketId) {
      fetchTicket();
    }
    // fetchTicket is defined inline below; its only externals are
    // `token` and `ticketId` which we already list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const fetchTicket = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
        // Mark as read if has unread messages
        if (data.hasUnreadAdminMessages) {
          markAsRead();
        }
      } else if (res.status === 404) {
        setError(t('help.ticketDetail.notFound'));
      } else {
        setError(t('help.ticketDetail.loadError'));
      }
    } catch (err) {
      setError(t('help.ticketDetail.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/support/tickets/${ticketId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!token || !ticket || !inputValue.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: inputValue }),
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setTicket(updatedTicket);
        setInputValue('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };



  const getStatusVariant = (status: string): 'warning' | 'info' | 'premium' | 'default' => {
    switch (status) {
      case 'open':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'resolved':
        return 'premium';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    // The translations live under `help.ticketCategories.*` - the old key
    // `helpPage.ticketCategories.*` doesn't exist (only `helpPage.status` does)
    // and i18next falls back to the raw key string, which is why users were
    // seeing "helpPage.ticketCategories.feedback" on the page.
    const key = `help.ticketCategories.${category}`;
    const translated = t(key);
    return translated && translated !== key ? translated : category;
  };

  // Group messages by date
  const groupMessagesByDate = (messages: SupportMessage[]) => {
    const groups: { date: string; messages: SupportMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
      <HeaderSpacer />
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" color="#1a472a" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
      <HeaderSpacer />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--hm-brand-50)] flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[var(--hm-brand-500)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-serif font-medium text-[var(--hm-fg-primary)] mb-2">
              {error}
            </h2>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 mt-4 text-[var(--hm-n-800)] font-medium hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('help.ticketDetail.backToHelp')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const messageGroups = groupMessagesByDate(ticket.messages);

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] flex flex-col">
      <Header />
      <HeaderSpacer />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back Link & Header */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-[var(--hm-fg-muted)] hover:text-[var(--hm-n-800)] transition-colors mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('help.ticketDetail.backToHelp')}
          </Link>

          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-serif font-medium text-[var(--hm-fg-primary)] mb-1.5 sm:mb-2 truncate">
                {ticket.subject}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[var(--hm-fg-muted)]">
                <span>{getCategoryLabel(ticket.category)}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--hm-border-strong)]" />
                <span>{formatDateLong(ticket.createdAt, locale)}</span>
              </div>
            </div>
            <Badge variant={getStatusVariant(ticket.status)} size="sm" className="flex-shrink-0">
              {(() => {
                const key = `helpPage.status.${ticket.status}`;
                const v = t(key);
                return v && v !== key ? v : ticket.status;
              })()}
            </Badge>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Separator */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-[var(--hm-bg-tertiary)]" />
                  <span className="text-xs text-[var(--hm-fg-muted)] font-medium">
                    {formatDateLong(group.date, locale)}
                  </span>
                  <div className="flex-1 h-px bg-[var(--hm-bg-tertiary)]" />
                </div>

                {/* Messages for this date */}
                <div className="space-y-2.5">
                  {group.messages.map((msg, msgIndex) => (
                    <div
                      key={msgIndex}
                      className={`flex ${!msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[78%] ${!msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar - shield for admin messages, identifies who's talking */}
                        {msg.isAdmin && (
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-700) 100%)' }}
                          >
                            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2} />
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={
                            !msg.isAdmin
                              ? 'px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[var(--hm-n-800)] text-white rounded-2xl rounded-br-md shadow-sm'
                              : 'px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-primary)] rounded-2xl rounded-bl-md border border-[var(--hm-border-subtle)]'
                          }
                        >
                          {msg.isAdmin && (
                            <p
                              className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-1"
                              style={{ color: 'var(--hm-brand-500)' }}
                            >
                              {t('help.ticketDetail.supportTeam')}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${!msg.isAdmin ? 'text-white/60' : 'text-[var(--hm-fg-muted)]'}`}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {ticket.status !== 'closed' ? (
            <div className="flex-shrink-0 p-4 border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)]">
              <div className="flex gap-3">
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
                  placeholder={t('help.ticketDetail.placeholder')}
                  rows={1}
                  className="flex-1 px-4 py-3 bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] rounded-xl text-sm text-[var(--hm-fg-primary)] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--hm-n-800)]/20 focus:border-[var(--hm-n-800)] resize-none transition-all duration-200"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className="w-12 h-12 rounded-xl bg-[var(--hm-n-800)] hover:bg-[var(--hm-n-700)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 flex-shrink-0"
                >
                  {isSending ? (
                    <LoadingSpinner size="md" color="white" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--hm-fg-muted)] mt-2">
                {t('help.ticketDetail.enterHint')}
              </p>
            </div>
          ) : (
            <div className="flex-shrink-0 p-4 border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] text-center">
              <p className="text-sm text-[var(--hm-fg-muted)]">
                {t('help.ticketDetail.ticketClosed')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
