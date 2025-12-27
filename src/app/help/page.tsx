'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  _id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  hasUnreadAdminMessages?: boolean;
}

export default function HelpPage() {
  const { t } = useLanguage();
  const { isAuthenticated, token, user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [contactForm, setContactForm] = useState({
    type: 'general' as 'account_issue' | 'general' | 'feedback',
    message: '',
    contactEmail: '',
  });
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'account',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const faqs: FAQ[] = [
    {
      question: t('helpPage.faq.createAccount.question'),
      answer: t('helpPage.faq.createAccount.answer'),
      category: 'getting-started',
    },
    {
      question: t('helpPage.faq.postJob.question'),
      answer: t('helpPage.faq.postJob.answer'),
      category: 'jobs',
    },
    {
      question: t('helpPage.faq.becomePro.question'),
      answer: t('helpPage.faq.becomePro.answer'),
      category: 'getting-started',
    },
    {
      question: t('helpPage.faq.submitProposal.question'),
      answer: t('helpPage.faq.submitProposal.answer'),
      category: 'jobs',
    },
    {
      question: t('helpPage.faq.editProfile.question'),
      answer: t('helpPage.faq.editProfile.answer'),
      category: 'account',
    },
    {
      question: t('helpPage.faq.contactSupport.question'),
      answer: t('helpPage.faq.contactSupport.answer'),
      category: 'support',
    },
  ];

  const categories = [
    { id: 'all', label: t('helpPage.categories.all') },
    { id: 'getting-started', label: t('helpPage.categories.gettingStarted') },
    { id: 'jobs', label: t('helpPage.categories.jobs') },
    { id: 'account', label: t('helpPage.categories.account') },
    { id: 'support', label: t('helpPage.categories.support') },
  ];

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  // Fetch user tickets if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchMyTickets();
    }
  }, [isAuthenticated, token]);

  const fetchMyTickets = async () => {
    if (!token) return;
    setLoadingTickets(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.message.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API_URL}/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setContactForm({ type: 'general', message: '', contactEmail: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const data = await res.json();
        setSubmitError(data.message || t('helpPage.contact.error'));
      }
    } catch (err) {
      setSubmitError(t('helpPage.contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketForm),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTicketForm({ subject: '', category: 'account', message: '', priority: 'medium' });
        setShowTicketForm(false);
        fetchMyTickets();
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const data = await res.json();
        setSubmitError(data.message || t('helpPage.contact.error'));
      }
    } catch (err) {
      setSubmitError(t('helpPage.contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      case 'resolved':
        return 'bg-[#C4735B]/5 text-[#C4735B] dark:bg-[#C4735B]/10 dark:text-[#E8956A]';
      case 'closed':
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B] via-[#B8654D] to-[#A85A45]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        {/* Decorative geometric elements */}
        <div className="absolute top-1/4 left-8 w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <div className="absolute top-1/3 right-12 w-px h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-8 left-1/4 w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-medium mb-6">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t('helpPage.badge')}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
              {t('helpPage.title')}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {t('helpPage.subtitle')}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Quick Actions for Authenticated Users */}
        {isAuthenticated && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-medium text-neutral-900 dark:text-neutral-50">
                {t('helpPage.myTickets.title')}
              </h2>
              <button
                onClick={() => {
                  setShowTicketForm(!showTicketForm);
                  if (!showTicketForm) {
                    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C4735B] hover:bg-[#B8654D] text-white text-sm font-medium rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('helpPage.myTickets.newTicket')}
              </button>
            </div>

            {/* New Ticket Form */}
            {showTicketForm && (
              <div ref={formRef} className="mb-6 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-[#C4735B]/10 dark:border-[#E8956A]/15 shadow-[0_2px_12px_rgba(196,115,91,0.06)] p-6 animate-fade-in">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-4">
                  {t('helpPage.myTickets.createTicket')}
                </h3>
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('helpPage.myTickets.subject')}
                    </label>
                    <input
                      type="text"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 dark:focus:ring-[#E8956A]/20 focus:border-[#C4735B] dark:focus:border-[#E8956A] transition-all duration-200"
                      placeholder={t('helpPage.myTickets.subjectPlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {t('helpPage.myTickets.category')}
                      </label>
                      <select
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                        className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 dark:focus:ring-[#E8956A]/20 focus:border-[#C4735B] dark:focus:border-[#E8956A] transition-all duration-200"
                      >
                        <option value="account">{t('helpPage.ticketCategories.account')}</option>
                        <option value="job">{t('helpPage.ticketCategories.job')}</option>
                        <option value="payment">{t('helpPage.ticketCategories.payment')}</option>
                        <option value="technical">{t('helpPage.ticketCategories.technical')}</option>
                        <option value="other">{t('helpPage.ticketCategories.other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {t('helpPage.myTickets.priority')}
                      </label>
                      <select
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                        className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 dark:focus:ring-[#E8956A]/20 focus:border-[#C4735B] dark:focus:border-[#E8956A] transition-all duration-200"
                      >
                        <option value="low">{t('helpPage.priorities.low')}</option>
                        <option value="medium">{t('helpPage.priorities.medium')}</option>
                        <option value="high">{t('helpPage.priorities.high')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('helpPage.myTickets.message')}
                    </label>
                    <textarea
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 dark:focus:ring-[#E8956A]/20 focus:border-[#C4735B] dark:focus:border-[#E8956A] transition-all duration-200 resize-none"
                      placeholder={t('helpPage.myTickets.messagePlaceholder')}
                    />
                  </div>

                  {submitError && (
                    <p className="text-sm text-terracotta-600 dark:text-terracotta-400">{submitError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTicketForm(false)}
                      className="px-5 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-[#C4735B] hover:bg-[#B8654D] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {t('common.loading')}
                        </>
                      ) : (
                        t('helpPage.myTickets.submit')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Success Message for Ticket Submission */}
            {submitSuccess && !showTicketForm && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">{'თქვენი შეტყობინება წარმატებით გაიგზავნა!'}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{'მალე გიპასუხებთ.'}</p>
                </div>
              </div>
            )}

            {/* Tickets List */}
            {loadingTickets ? (
              <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-[#C4735B]/10 dark:border-[#E8956A]/15 p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#C4735B]/20 dark:border-[#E8956A]/20 border-t-[#C4735B] dark:border-t-[#E8956A] rounded-full animate-spin" />
              </div>
            ) : myTickets.length > 0 ? (
              <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-[#C4735B]/10 dark:border-[#E8956A]/15 shadow-[0_2px_12px_rgba(196,115,91,0.06)] overflow-hidden">
                <div className="divide-y divide-neutral-100 dark:divide-dark-border">
                  {myTickets.map((ticket) => (
                    <Link
                      key={ticket._id}
                      href={`/help/ticket/${ticket._id}`}
                      className="flex items-center justify-between p-4 hover:bg-cream-50 dark:hover:bg-dark-elevated transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          ticket.status === 'open' ? 'bg-amber-50 dark:bg-amber-500/10' :
                          ticket.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-500/10' :
                          ticket.status === 'resolved' ? 'bg-[#C4735B]/5 dark:bg-[#C4735B]/10' :
                          'bg-neutral-100 dark:bg-neutral-500/10'
                        }`}>
                          <svg className={`w-5 h-5 ${
                            ticket.status === 'open' ? 'text-amber-600 dark:text-amber-400' :
                            ticket.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' :
                            ticket.status === 'resolved' ? 'text-[#C4735B] dark:text-[#E8956A]' :
                            'text-neutral-500 dark:text-neutral-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-neutral-900 dark:text-neutral-50 truncate">
                              {ticket.subject}
                            </p>
                            {ticket.hasUnreadAdminMessages && (
                              <span className="w-2 h-2 bg-terracotta-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getStatusStyles(ticket.status)}`}>
                          {t(`helpPage.status.${ticket.status}`)}
                        </span>
                        <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-[#C4735B]/10 dark:border-[#E8956A]/15 p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#C4735B]/10 dark:bg-[#E8956A]/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#C4735B] dark:text-[#E8956A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 mb-1">{t('helpPage.myTickets.noTickets')}</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('helpPage.myTickets.noTicketsDesc')}</p>
              </div>
            )}
          </section>
        )}

        {/* FAQ Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
              {t('helpPage.faq.title')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              {t('helpPage.faq.subtitle')}
            </p>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-[#C4735B] to-[#B8654D] text-white shadow-lg shadow-[#C4735B]/20'
                    : 'bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm text-neutral-600 dark:text-neutral-400 hover:bg-[#C4735B]/5 dark:hover:bg-[#E8956A]/10 border border-[#C4735B]/10 dark:border-[#E8956A]/15'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-[#C4735B]/10 dark:border-[#E8956A]/15 shadow-[0_2px_12px_rgba(196,115,91,0.06)] overflow-hidden">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className={`${index !== filteredFaqs.length - 1 ? 'border-b border-neutral-100 dark:border-dark-border' : ''}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-cream-50 dark:hover:bg-dark-elevated transition-colors"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-50 pr-8">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-lg bg-cream-100 dark:bg-dark-elevated flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-5 pb-5">
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section - For non-authenticated users */}
        {!isAuthenticated && (
          <section className="mb-12">
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-neutral-100 dark:border-dark-border">
                <h2 className="text-xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  {t('helpPage.contact.title')}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {t('helpPage.contact.subtitle')}
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t('helpPage.contact.type')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'general', label: t('helpPage.contact.types.general'), icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' },
                      { value: 'account_issue', label: t('helpPage.contact.types.account'), icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
                      { value: 'feedback', label: t('helpPage.contact.types.feedback'), icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setContactForm({ ...contactForm, type: type.value as 'general' | 'account_issue' | 'feedback' })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                          contactForm.type === type.value
                            ? 'border-[#C4735B] dark:border-[#E8956A] bg-[#C4735B]/5 dark:bg-[#E8956A]/10'
                            : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <svg className={`w-5 h-5 mx-auto mb-2 ${contactForm.type === type.value ? 'text-[#C4735B] dark:text-[#E8956A]' : 'text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                        </svg>
                        <span className={`text-sm font-medium ${contactForm.type === type.value ? 'text-[#C4735B] dark:text-[#E8956A]' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t('helpPage.contact.email')}
                  </label>
                  <input
                    type="email"
                    value={contactForm.contactEmail}
                    onChange={(e) => setContactForm({ ...contactForm, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 dark:focus:ring-[#E8956A]/20 focus:border-[#C4735B] dark:focus:border-[#E8956A] transition-all duration-200"
                    placeholder={t('helpPage.contact.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t('helpPage.contact.message')}
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-cream-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 dark:focus:ring-[#E8956A]/20 focus:border-[#C4735B] dark:focus:border-[#E8956A] transition-all duration-200 resize-none"
                    placeholder={t('helpPage.contact.messagePlaceholder')}
                  />
                </div>

                {submitError && (
                  <p className="text-sm text-terracotta-600 dark:text-terracotta-400">{submitError}</p>
                )}

                {submitSuccess ? (
                  <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">{'თქვენი შეტყობინება წარმატებით გაიგზავნა!'}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{'მალე გიპასუხებთ.'}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !contactForm.message.trim()}
                    className="w-full py-3.5 bg-[#C4735B] hover:bg-[#B8654D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {t('helpPage.contact.send')}
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>

            {/* Alternative: Sign in prompt */}
            <div className="mt-6 p-5 bg-cream-100 dark:bg-dark-elevated rounded-xl text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                {t('helpPage.signInPrompt')}
              </p>
              <button
                onClick={() => openLoginModal()}
                className="inline-flex items-center gap-2 text-[#C4735B] dark:text-[#E8956A] font-medium text-sm hover:underline"
              >
                {t('auth.signIn')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* Contact Info Cards */}
        <section>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="mailto:info@homico.ge"
              className="group p-6 bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border hover:border-[#C4735B]/20 dark:hover:border-[#E8956A]/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4735B] to-[#B8654D] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                    {t('helpPage.contactCards.email.title')}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    {t('helpPage.contactCards.email.description')}
                  </p>
                  <span className="text-[#C4735B] dark:text-[#E8956A] font-medium text-sm">
                    info@homico.ge
                  </span>
                </div>
              </div>
            </a>

            <div className="p-6 bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4735B] to-[#B8654D] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                    {t('helpPage.contactCards.response.title')}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    {t('helpPage.contactCards.response.description')}
                  </p>
                  <span className="text-[#C4735B] dark:text-[#E8956A] font-medium text-sm">
                    {t('helpPage.contactCards.response.time')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
