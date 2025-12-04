'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SupportMessage {
  senderId: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportMessage[];
  lastMessageAt: string;
  hasUnreadAdminMessages: boolean;
}

type ViewState = 'button' | 'tickets' | 'new-ticket' | 'chat';

const categories = [
  { id: 'account', icon: 'user', labelEn: 'Account & Profile', labelKa: 'ანგარიში' },
  { id: 'payment', icon: 'card', labelEn: 'Payments & Billing', labelKa: 'გადახდები' },
  { id: 'job', icon: 'briefcase', labelEn: 'Jobs & Projects', labelKa: 'სამუშაოები' },
  { id: 'technical', icon: 'tool', labelEn: 'Technical Issues', labelKa: 'ტექნიკური' },
  { id: 'other', icon: 'help', labelEn: 'Other', labelKa: 'სხვა' },
];

const CategoryIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'user':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case 'card':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      );
    case 'tool':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      );
  }
};

export default function SupportChat() {
  const { user, isAuthenticated, token } = useAuth();
  const { locale } = useLanguage();
  const [view, setView] = useState<ViewState>('button');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [newTicketData, setNewTicketData] = useState({ category: '', subject: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTicket?.messages]);

  useEffect(() => {
    if (view === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [view]);

  const fetchTickets = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/my`, {
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

  const fetchTicket = async (ticketId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTicket(data);
        // Mark as read
        await fetch(`${API_URL}/support/tickets/${ticketId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    }
  };

  const createTicket = async () => {
    if (!token || !newTicketData.category || !newTicketData.subject || !newTicketData.message) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTicketData),
      });
      if (res.ok) {
        const ticket = await res.json();
        setCurrentTicket(ticket);
        setNewTicketData({ category: '', subject: '', message: '' });
        setView('chat');
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (!token || !currentTicket || !inputValue.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${currentTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: inputValue }),
      });
      if (res.ok) {
        const updatedTicket = await res.json();
        setCurrentTicket(updatedTicket);
        setInputValue('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const openChat = () => {
    setView('tickets');
    fetchTickets();
  };

  const openTicket = (ticket: SupportTicket) => {
    setCurrentTicket(ticket);
    fetchTicket(ticket._id);
    setView('chat');
  };

  const startNewTicket = () => {
    setNewTicketData({ category: '', subject: '', message: '' });
    setView('new-ticket');
  };

  const goBack = () => {
    if (view === 'chat' || view === 'new-ticket') {
      setView('tickets');
      setCurrentTicket(null);
      fetchTickets();
    } else {
      setView('button');
    }
  };

  const closeChat = () => {
    setView('button');
    setCurrentTicket(null);
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

    if (days === 0) return locale === 'ka' ? 'დღეს' : 'Today';
    if (days === 1) return locale === 'ka' ? 'გუშინ' : 'Yesterday';
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ka: string }> = {
      open: { en: 'Open', ka: 'ღია' },
      in_progress: { en: 'In Progress', ka: 'მუშავდება' },
      resolved: { en: 'Resolved', ka: 'გადაწყდა' },
      closed: { en: 'Closed', ka: 'დახურული' },
    };
    return labels[status]?.[locale === 'ka' ? 'ka' : 'en'] || status;
  };

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = tickets.filter(t => t.hasUnreadAdminMessages).length;

  return (
    <>
      {/* Floating Button */}
      {view === 'button' && (
        <button
          onClick={openChat}
          className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
          style={{
            background: 'linear-gradient(135deg, #22543d 0%, #38855e 100%)',
            boxShadow: '0 8px 32px rgba(34, 84, 61, 0.35)',
          }}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel - Full screen on mobile */}
      {view !== 'button' && (
        <div
          className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-4 z-50 sm:w-[380px] sm:max-h-[calc(100vh-120px)] sm:rounded-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 px-4 py-3 sm:py-4 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #22543d 0%, #38855e 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              {view !== 'tickets' && (
                <button
                  onClick={goBack}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {view === 'tickets' && (locale === 'ka' ? 'დახმარება' : 'Support')}
                  {view === 'new-ticket' && (locale === 'ka' ? 'ახალი მოთხოვნა' : 'New Request')}
                  {view === 'chat' && (currentTicket?.subject || (locale === 'ka' ? 'ჩატი' : 'Chat'))}
                </h3>
                <p className="text-xs text-emerald-200">
                  {view === 'tickets' && (locale === 'ka' ? 'როგორ შეგვიძლია დაგეხმაროთ?' : 'How can we help?')}
                  {view === 'new-ticket' && (locale === 'ka' ? 'აღწერეთ თქვენი პრობლემა' : 'Describe your issue')}
                  {view === 'chat' && currentTicket && getStatusLabel(currentTicket.status)}
                </p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            {/* Tickets List View */}
            {view === 'tickets' && (
              <div className="p-3 sm:p-4">
                {/* New Ticket Button */}
                <button
                  onClick={startNewTicket}
                  className="w-full mb-4 p-3 sm:p-4 rounded-xl border-2 border-dashed flex items-center gap-3 transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {locale === 'ka' ? 'ახალი მოთხოვნა' : 'New Support Request'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {locale === 'ka' ? 'დაუკავშირდით მხარდაჭერას' : 'Contact our support team'}
                    </p>
                  </div>
                </button>

                {/* Tickets */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-text-primary)' }} />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                      <svg className="w-8 h-8" style={{ color: 'var(--color-text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {locale === 'ka' ? 'მოთხოვნები არ გაქვთ' : 'No tickets yet'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {locale === 'ka' ? 'შექმენით ახალი მოთხოვნა' : 'Create a new support request'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket._id}
                        onClick={() => openTicket(ticket)}
                        className="w-full p-3 rounded-xl text-left transition-all hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: `1px solid ${ticket.hasUnreadAdminMessages ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-medium text-sm truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>
                            {ticket.subject}
                          </p>
                          {ticket.hasUnreadAdminMessages && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            {formatDate(ticket.lastMessageAt)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Ticket View */}
            {view === 'new-ticket' && (
              <div className="p-3 sm:p-4">
                {/* Category Selection */}
                {!newTicketData.category ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {locale === 'ka' ? 'აირჩიეთ კატეგორია' : 'Select a category'}
                    </p>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewTicketData({ ...newTicketData, category: cat.id })}
                        className="w-full p-3 rounded-xl flex items-center gap-3 transition-all hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                          <CategoryIcon type={cat.icon} className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' } as any} />
                        </div>
                        <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {locale === 'ka' ? cat.labelKa : cat.labelEn}
                        </span>
                        <svg className="w-4 h-4 ml-auto" style={{ color: 'var(--color-text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected Category */}
                    <div
                      className="p-3 rounded-xl flex items-center gap-3"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                      <CategoryIcon type={categories.find(c => c.id === newTicketData.category)?.icon || 'help'} className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' } as any} />
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {locale === 'ka'
                          ? categories.find(c => c.id === newTicketData.category)?.labelKa
                          : categories.find(c => c.id === newTicketData.category)?.labelEn}
                      </span>
                      <button
                        onClick={() => setNewTicketData({ ...newTicketData, category: '' })}
                        className="ml-auto text-xs"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {locale === 'ka' ? 'შეცვლა' : 'Change'}
                      </button>
                    </div>

                    {/* Subject Input */}
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {locale === 'ka' ? 'თემა' : 'Subject'}
                      </label>
                      <input
                        type="text"
                        value={newTicketData.subject}
                        onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                        placeholder={locale === 'ka' ? 'მოკლედ აღწერეთ პრობლემა' : 'Brief description of your issue'}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>

                    {/* Message Input */}
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {locale === 'ka' ? 'შეტყობინება' : 'Message'}
                      </label>
                      <textarea
                        value={newTicketData.message}
                        onChange={(e) => setNewTicketData({ ...newTicketData, message: e.target.value })}
                        placeholder={locale === 'ka' ? 'დეტალურად აღწერეთ თქვენი პრობლემა...' : 'Describe your issue in detail...'}
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={createTicket}
                      disabled={!newTicketData.subject || !newTicketData.message || isSending}
                      className="w-full py-3 rounded-xl font-medium text-sm text-white transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #22543d 0%, #38855e 100%)',
                      }}
                    >
                      {isSending
                        ? (locale === 'ka' ? 'იგზავნება...' : 'Sending...')
                        : (locale === 'ka' ? 'გაგზავნა' : 'Send')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chat View */}
            {view === 'chat' && currentTicket && (
              <div className="p-3 sm:p-4 space-y-3">
                {currentTicket.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2.5 ${
                        msg.isAdmin
                          ? 'rounded-2xl rounded-bl-md'
                          : 'rounded-2xl rounded-br-md'
                      }`}
                      style={{
                        backgroundColor: msg.isAdmin ? 'var(--color-bg-primary)' : '#22543d',
                        color: msg.isAdmin ? 'var(--color-text-primary)' : 'white',
                        border: msg.isAdmin ? '1px solid var(--color-border-subtle)' : 'none',
                      }}
                    >
                      {msg.isAdmin && (
                        <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                          {locale === 'ka' ? 'მხარდაჭერა' : 'Support'}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.isAdmin ? 'text-neutral-400' : 'text-white/60'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area - Only in chat view */}
          {view === 'chat' && currentTicket && currentTicket.status !== 'closed' && currentTicket.status !== 'resolved' && (
            <div
              className="flex-shrink-0 p-3 sm:p-4"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
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
                  placeholder={locale === 'ka' ? 'დაწერეთ შეტყობინება...' : 'Type a message...'}
                  rows={1}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
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
                  style={{
                    background: 'linear-gradient(135deg, #22543d 0%, #38855e 100%)',
                  }}
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Closed/Resolved ticket message */}
          {view === 'chat' && currentTicket && (currentTicket.status === 'closed' || currentTicket.status === 'resolved') && (
            <div
              className="flex-shrink-0 p-4 text-center"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {currentTicket.status === 'closed'
                  ? (locale === 'ka' ? 'ეს მოთხოვნა დახურულია' : 'This ticket is closed')
                  : (locale === 'ka' ? 'ეს მოთხოვნა გადაწყვეტილია' : 'This ticket has been resolved')
                }
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
