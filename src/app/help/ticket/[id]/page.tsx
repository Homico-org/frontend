'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateLong, formatMessageTime } from '@/utils/dateUtils';
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
        setError(t('helpPage.ticketDetail.notFound'));
      } else {
        setError(t('helpPage.ticketDetail.loadError'));
      }
    } catch (err) {
      setError(t('helpPage.ticketDetail.loadError'));
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
    return t(`helpPage.ticketCategories.${category}`) || category;
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
      <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
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
      <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
        <Header />
      <HeaderSpacer />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-terracotta-50 dark:bg-terracotta-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
              {error}
            </h2>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 mt-4 text-forest-800 dark:text-primary-400 font-medium hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('helpPage.ticketDetail.backToHelp')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const messageGroups = groupMessagesByDate(ticket.messages);

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex flex-col">
      <Header />
      <HeaderSpacer />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Link & Header */}
        <div className="mb-6">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-forest-800 dark:hover:text-primary-400 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('helpPage.ticketDetail.backToHelp')}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2 truncate">
                {ticket.subject}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{getCategoryLabel(ticket.category)}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <span>{formatDateLong(ticket.createdAt, locale)}</span>
              </div>
            </div>
            <Badge variant={getStatusVariant(ticket.status)} size="sm" className="flex-shrink-0">
              {t(`helpPage.status.${ticket.status}`)}
            </Badge>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Separator */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-neutral-100 dark:bg-dark-border" />
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                    {formatDateLong(group.date, locale)}
                  </span>
                  <div className="flex-1 h-px bg-neutral-100 dark:bg-dark-border" />
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {group.messages.map((msg, msgIndex) => (
                    <div
                      key={msgIndex}
                      className={`flex ${!msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[85%] ${!msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        {msg.isAdmin && (
                          <div className="w-8 h-8 rounded-full bg-forest-800 dark:bg-primary-400 flex items-center justify-center flex-shrink-0 mb-1">
                            <svg className="w-4 h-4 text-white dark:text-forest-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`px-4 py-3 ${
                            !msg.isAdmin
                              ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-forest-900 rounded-2xl rounded-br-md'
                              : 'bg-cream-100 dark:bg-dark-elevated text-neutral-900 dark:text-neutral-50 rounded-2xl rounded-bl-md'
                          }`}
                        >
                          {msg.isAdmin && (
                            <p className="text-xs font-medium text-forest-800 dark:text-primary-400 mb-1">
                              {t('helpPage.ticketDetail.supportTeam')}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${!msg.isAdmin ? 'text-white/60 dark:text-forest-900/60' : 'text-neutral-400 dark:text-neutral-500'}`}>
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
            <div className="flex-shrink-0 p-4 border-t border-neutral-100 dark:border-dark-border bg-cream-50 dark:bg-dark-elevated">
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
                  placeholder={t('helpPage.ticketDetail.placeholder')}
                  rows={1}
                  className="flex-1 px-4 py-3 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-xl text-sm text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-800/20 dark:focus:ring-primary-400/20 focus:border-forest-800 dark:focus:border-primary-400 resize-none transition-all duration-200"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className="w-12 h-12 rounded-xl bg-forest-800 hover:bg-forest-700 dark:bg-primary-400 dark:hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 flex-shrink-0"
                >
                  {isSending ? (
                    <LoadingSpinner size="md" color="white" />
                  ) : (
                    <svg className="w-5 h-5 text-white dark:text-forest-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                {t('helpPage.ticketDetail.enterHint')}
              </p>
            </div>
          ) : (
            <div className="flex-shrink-0 p-4 border-t border-neutral-100 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('helpPage.ticketDetail.ticketClosed')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
