'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import Select from '@/components/common/Select';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateShort } from '@/utils/dateUtils';
import { ChevronDown, ChevronRight, Clock, Mail, MessageCircle, Plus, Send } from 'lucide-react';
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
      question: t("help.faq.createAccountQuestion"),
      answer: t("help.faq.createAccountAnswer"),
      category: 'getting-started',
    },
    {
      question: t("help.faq.postJobQuestion"),
      answer: t("help.faq.postJobAnswer"),
      category: 'jobs',
    },
    {
      question: t("help.faq.becomeProQuestion"),
      answer: t("help.faq.becomeProAnswer"),
      category: 'getting-started',
    },
    {
      question: t("help.faq.submitProposalQuestion"),
      answer: t("help.faq.submitProposalAnswer"),
      category: 'jobs',
    },
    {
      question: t("help.faq.editProfileQuestion"),
      answer: t("help.faq.editProfileAnswer"),
      category: 'account',
    },
    {
      question: t("help.faq.contactSupportQuestion"),
      answer: t("help.faq.contactSupportAnswer"),
      category: 'support',
    },
  ];

  const categories = [
    { id: 'all', label: t('common.all') },
    { id: 'getting-started', label: t('help.categories.gettingStarted') },
    { id: 'jobs', label: t('common.jobs') },
    { id: 'account', label: t('common.account') },
    { id: 'support', label: t('help.categories.support') },
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
        setSubmitError(data.message || t('common.error'));
      }
    } catch (err) {
      setSubmitError(t('common.error'));
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
        setSubmitError(data.message || t('common.error'));
      }
    } catch (err) {
      setSubmitError(t('common.error'));
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <Header />
      <HeaderSpacer />

      {/* Compact Hero */}
      <div className="bg-gradient-to-r from-[#C4735B] to-[#A85A45] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
            {t('help.title')}
          </h1>
          <p className="text-sm text-white/70 max-w-lg mx-auto">
            {t('help.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

        {/* Support Tickets */}
        {isAuthenticated && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t('help.categories.support')}
              </h2>
              <Button
                onClick={() => {
                  setShowTicketForm(!showTicketForm);
                  if (!showTicketForm) {
                    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                  }
                }}
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t("help.tickets.newTicket")}
              </Button>
            </div>

            {/* New Ticket Form */}
            {showTicketForm && (
              <Card ref={formRef} variant="elevated" size="lg" className="mb-6 animate-fade-in">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-4">
                  {t("help.tickets.createTicket")}
                </h3>
                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <FormGroup>
                    <Label>{t("help.tickets.subject")}</Label>
                    <Input
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      required
                      placeholder={t("help.tickets.subjectPlaceholder")}
                    />
                  </FormGroup>

                  <div className="grid grid-cols-2 gap-4">
                    <FormGroup>
                      <Label>{t("help.tickets.category")}</Label>
                      <Select
                        value={ticketForm.category}
                        onChange={(value) => setTicketForm({ ...ticketForm, category: value })}
                        options={[
                          { value: 'account', label: t('common.account') },
                          { value: 'job', label: t('help.ticketCategories.job') },
                          { value: 'payment', label: t('help.ticketCategories.payment') },
                          { value: 'technical', label: t('help.ticketCategories.technical') },
                          { value: 'other', label: t('common.other') },
                        ]}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>{t('common.priority')}</Label>
                      <Select
                        value={ticketForm.priority}
                        onChange={(value) => setTicketForm({ ...ticketForm, priority: value as 'low' | 'medium' | 'high' })}
                        options={[
                          { value: 'low', label: t('help.priorities.low') },
                          { value: 'medium', label: t('help.priorities.medium') },
                          { value: 'high', label: t('help.priorities.high') },
                        ]}
                      />
                    </FormGroup>
                  </div>

                  <FormGroup>
                    <Label>{t('common.message')}</Label>
                    <Textarea
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      required
                      rows={4}
                      placeholder={t("help.tickets.messagePlaceholder")}
                    />
                  </FormGroup>

                  {submitError && (
                    <Alert variant="error" size="sm">{submitError}</Alert>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowTicketForm(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    >
                      {t('common.submit')}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Success Message for Ticket Submission */}
            {submitSuccess && !showTicketForm && (
              <Alert variant="success" className="mb-6 animate-fade-in">
                <p className="font-medium">{'თქვენი შეტყობინება წარმატებით გაიგზავნა!'}</p>
                <p className="text-sm opacity-80">{'მალე გიპასუხებთ.'}</p>
              </Alert>
            )}

            {/* Tickets List */}
            {loadingTickets ? (
              <Card variant="default" size="lg" className="flex items-center justify-center">
                <LoadingSpinner size="xl" variant="border" color="#C4735B" />
              </Card>
            ) : myTickets.length > 0 ? (
              <Card variant="elevated" size="sm" className="overflow-hidden">
                <div className="divide-y divide-neutral-100 dark:divide-dark-border -m-3 sm:-m-4">
                  {myTickets.map((ticket) => (
                    <Link
                      key={ticket._id}
                      href={`/help/ticket/${ticket._id}`}
                      className="flex items-center justify-between p-4 hover:bg-cream-50 dark:hover:bg-dark-elevated transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <IconBadge
                          icon={MessageCircle}
                          variant={
                            ticket.status === 'open' ? 'warning' :
                            ticket.status === 'in_progress' ? 'info' :
                            ticket.status === 'resolved' ? 'accent' :
                            'neutral'
                          }
                          size="md"
                        />
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
                            {formatDateShort(ticket.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusVariant(ticket.status)} size="sm">
                          {t(`helpPage.status.${ticket.status}`)}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            ) : (
              <Card variant="default" size="lg" className="text-center">
                <div className="flex justify-center mb-4">
                  <IconBadge icon={MessageCircle} variant="accent" size="lg" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 mb-1">{t("help.tickets.noTickets")}</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">{t("help.tickets.noTicketsDesc")}</p>
              </Card>
            )}
          </section>
        )}

        {/* FAQ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('help.faq.subtitle')}
            </h2>
            {/* Category filter */}
            <div className="flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[#C4735B] text-white'
                      : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className={index !== filteredFaqs.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-sm font-medium text-neutral-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-4 pb-3">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form - For non-authenticated users */}
        {!isAuthenticated && (
          <section>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t('help.contact.subtitle')}
                </h2>
              </div>

              <form onSubmit={handleContactSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t('common.type')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'general', label: t('help.contact.types.general'), icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' },
                      { value: 'account_issue', label: t('common.account'), icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
                      { value: 'feedback', label: t('help.contact.types.feedback'), icon: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
                    ].map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={contactForm.type === type.value ? 'outline' : 'secondary'}
                        onClick={() => setContactForm({ ...contactForm, type: type.value as 'general' | 'account_issue' | 'feedback' })}
                        className={`p-4 h-auto flex-col ${
                          contactForm.type === type.value
                            ? 'border-[#C4735B] dark:border-[#E8956A] bg-[#C4735B]/5 dark:bg-[#E8956A]/10'
                            : ''
                        }`}
                      >
                        <svg className={`w-5 h-5 mb-2 ${contactForm.type === type.value ? 'text-[#C4735B] dark:text-[#E8956A]' : 'text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                        </svg>
                        <span className={`text-sm font-medium ${contactForm.type === type.value ? 'text-[#C4735B] dark:text-[#E8956A]' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {type.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <FormGroup>
                  <Label>{t('common.email')}</Label>
                  <Input
                    type="email"
                    value={contactForm.contactEmail}
                    onChange={(e) => setContactForm({ ...contactForm, contactEmail: e.target.value })}
                    placeholder={t('help.contact.emailPlaceholder')}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t('common.message')}</Label>
                  <Textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={4}
                    placeholder={t('help.contact.messagePlaceholder')}
                  />
                </FormGroup>

                {submitError && (
                  <Alert variant="error" size="sm">{submitError}</Alert>
                )}

                {submitSuccess ? (
                  <Alert variant="success" className="animate-fade-in">
                    <p className="font-medium">{'თქვენი შეტყობინება წარმატებით გაიგზავნა!'}</p>
                    <p className="text-sm opacity-80">{'მალე გიპასუხებთ.'}</p>
                  </Alert>
                ) : (
                  <Button
                    type="submit"
                    disabled={!contactForm.message.trim()}
                    loading={isSubmitting}
                    size="lg"
                    className="w-full"
                    leftIcon={<Send className="w-5 h-5" />}
                  >
                    {t('common.send')}
                  </Button>
                )}
              </form>
            </div>

            {/* Sign in prompt */}
            <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-center">
              <p className="text-xs text-neutral-500 mb-1.5">
                {t('help.signInPrompt')}
              </p>
              <button
                onClick={() => openLoginModal()}
                className="text-xs font-semibold text-[#C4735B] hover:underline"
              >
                {t('auth.signIn')} →
              </button>
            </div>
          </section>
        )}

        {/* Contact Info */}
        <section>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="mailto:info@homico.ge"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-[#C4735B]/30 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#C4735B]/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-[#C4735B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-[#C4735B] transition-colors">info@homico.ge</p>
              </div>
            </a>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="w-9 h-9 rounded-lg bg-[#C4735B]/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-[#C4735B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">{t('help.categories.support')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">09:00 – 18:00</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
