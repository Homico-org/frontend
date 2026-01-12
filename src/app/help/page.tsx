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
import { ArrowRight, ChevronDown, ChevronRight, Clock, Mail, MessageCircle, Plus, Send } from 'lucide-react';
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
              {t('help.badge')}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
              {t('common.title')}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {t('help.subtitle')}
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
                {t('common.title')}
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

        {/* FAQ Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
              {t('common.title')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              {t('help.faq.subtitle')}
            </p>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'premium' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* FAQ Items */}
          <Card variant="elevated" size="sm" className="overflow-hidden">
            <div className="-m-3 sm:-m-4">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className={`${index !== filteredFaqs.length - 1 ? 'border-b border-neutral-100 dark:border-dark-border' : ''}`}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-cream-50 dark:hover:bg-dark-elevated rounded-none h-auto"
                  >
                    <span className="font-medium text-neutral-900 dark:text-neutral-50 pr-8">
                      {faq.question}
                    </span>
                    <div className={`w-8 h-8 rounded-lg bg-cream-100 dark:bg-dark-elevated flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </div>
                  </Button>
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
          </Card>
        </section>

        {/* Contact Section - For non-authenticated users */}
        {!isAuthenticated && (
          <section className="mb-12">
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-neutral-100 dark:border-dark-border">
                <h2 className="text-xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  {t('common.title')}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {t('help.contact.subtitle')}
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 space-y-5">
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

            {/* Alternative: Sign in prompt */}
            <div className="mt-6 p-5 bg-cream-100 dark:bg-dark-elevated rounded-xl text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                {t('help.signInPrompt')}
              </p>
              <Button
                variant="link"
                onClick={() => openLoginModal()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('auth.signIn')}
              </Button>
            </div>
          </section>
        )}

        {/* Contact Info Cards */}
        <section>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="mailto:info@homico.ge">
              <Card variant="interactive" size="lg" hover className="group h-full">
                <div className="flex items-start gap-4">
                  <IconBadge icon={Mail} variant="accent" size="lg" className="group-hover:scale-105 transition-transform duration-300" />
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                      {t('common.title')}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                      {t('common.description')}
                    </p>
                    <span className="text-[#C4735B] dark:text-[#E8956A] font-medium text-sm">
                      info@homico.ge
                    </span>
                  </div>
                </div>
              </Card>
            </a>

            <Card variant="default" size="lg">
              <div className="flex items-start gap-4">
                <IconBadge icon={Clock} variant="accent" size="lg" />
                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                    {t('common.title')}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    {t('common.description')}
                  </p>
                  <span className="text-[#C4735B] dark:text-[#E8956A] font-medium text-sm">
                    {t('common.time')}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
