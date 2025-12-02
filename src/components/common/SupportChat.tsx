'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, X, Send, ChevronLeft, Search, User, Briefcase, Building2, HelpCircle, FileText, CreditCard, Shield, AlertCircle } from 'lucide-react';
import Avatar from './Avatar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support' | 'system';
  timestamp: Date;
  relatedItem?: RelatedItem;
}

interface RelatedItem {
  type: 'pro' | 'job' | 'order' | 'company';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

interface Suggestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
}

type ChatStep = 'welcome' | 'category' | 'suggestions' | 'select-item' | 'chat';

export default function SupportChat() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [selectedItem, setSelectedItem] = useState<RelatedItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userRole = user?.role || 'client';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && step === 'chat') {
      inputRef.current?.focus();
    }
  }, [isOpen, step]);

  const getCategories = () => {
    const commonCategories = [
      { id: 'account', icon: <User className="w-5 h-5" />, label: t('support.categories.account') },
      { id: 'payment', icon: <CreditCard className="w-5 h-5" />, label: t('support.categories.payment') },
      { id: 'security', icon: <Shield className="w-5 h-5" />, label: t('support.categories.security') },
      { id: 'other', icon: <HelpCircle className="w-5 h-5" />, label: t('support.categories.other') },
    ];

    if (userRole === 'client') {
      return [
        { id: 'finding-pro', icon: <Search className="w-5 h-5" />, label: t('support.categories.findingPro') },
        { id: 'job-posting', icon: <FileText className="w-5 h-5" />, label: t('support.categories.jobPosting') },
        { id: 'orders', icon: <Briefcase className="w-5 h-5" />, label: t('support.categories.orders') },
        ...commonCategories,
      ];
    } else if (userRole === 'pro') {
      return [
        { id: 'finding-jobs', icon: <Search className="w-5 h-5" />, label: t('support.categories.findingJobs') },
        { id: 'proposals', icon: <FileText className="w-5 h-5" />, label: t('support.categories.proposals') },
        { id: 'profile', icon: <User className="w-5 h-5" />, label: t('support.categories.profile') },
        ...commonCategories,
      ];
    } else if (userRole === 'company') {
      return [
        { id: 'employees', icon: <Building2 className="w-5 h-5" />, label: t('support.categories.employees') },
        { id: 'job-management', icon: <Briefcase className="w-5 h-5" />, label: t('support.categories.jobManagement') },
        { id: 'company-profile', icon: <Building2 className="w-5 h-5" />, label: t('support.categories.companyProfile') },
        ...commonCategories,
      ];
    }

    return commonCategories;
  };

  const getSuggestions = (): Suggestion[] => {
    if (!selectedCategory) return [];

    const suggestionMap: Record<string, Record<string, Suggestion[]>> = {
      client: {
        'finding-pro': [
          { id: 'how-to-find', icon: <Search className="w-4 h-4" />, title: t('support.suggestions.client.howToFind'), description: t('support.suggestions.client.howToFindDesc'), category: 'finding-pro' },
          { id: 'compare-pros', icon: <User className="w-4 h-4" />, title: t('support.suggestions.client.comparePros'), description: t('support.suggestions.client.compareProsDesc'), category: 'finding-pro' },
          { id: 'verify-pro', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.client.verifyPro'), description: t('support.suggestions.client.verifyProDesc'), category: 'finding-pro' },
        ],
        'job-posting': [
          { id: 'create-job', icon: <FileText className="w-4 h-4" />, title: t('support.suggestions.client.createJob'), description: t('support.suggestions.client.createJobDesc'), category: 'job-posting' },
          { id: 'edit-job', icon: <FileText className="w-4 h-4" />, title: t('support.suggestions.client.editJob'), description: t('support.suggestions.client.editJobDesc'), category: 'job-posting' },
          { id: 'job-visibility', icon: <Search className="w-4 h-4" />, title: t('support.suggestions.client.jobVisibility'), description: t('support.suggestions.client.jobVisibilityDesc'), category: 'job-posting' },
        ],
        'orders': [
          { id: 'order-status', icon: <Briefcase className="w-4 h-4" />, title: t('support.suggestions.client.orderStatus'), description: t('support.suggestions.client.orderStatusDesc'), category: 'orders' },
          { id: 'cancel-order', icon: <AlertCircle className="w-4 h-4" />, title: t('support.suggestions.client.cancelOrder'), description: t('support.suggestions.client.cancelOrderDesc'), category: 'orders' },
          { id: 'dispute', icon: <AlertCircle className="w-4 h-4" />, title: t('support.suggestions.client.dispute'), description: t('support.suggestions.client.disputeDesc'), category: 'orders' },
        ],
      },
      pro: {
        'finding-jobs': [
          { id: 'browse-jobs', icon: <Search className="w-4 h-4" />, title: t('support.suggestions.pro.browseJobs'), description: t('support.suggestions.pro.browseJobsDesc'), category: 'finding-jobs' },
          { id: 'job-alerts', icon: <AlertCircle className="w-4 h-4" />, title: t('support.suggestions.pro.jobAlerts'), description: t('support.suggestions.pro.jobAlertsDesc'), category: 'finding-jobs' },
          { id: 'match-skills', icon: <User className="w-4 h-4" />, title: t('support.suggestions.pro.matchSkills'), description: t('support.suggestions.pro.matchSkillsDesc'), category: 'finding-jobs' },
        ],
        'proposals': [
          { id: 'write-proposal', icon: <FileText className="w-4 h-4" />, title: t('support.suggestions.pro.writeProposal'), description: t('support.suggestions.pro.writeProposalDesc'), category: 'proposals' },
          { id: 'proposal-status', icon: <Briefcase className="w-4 h-4" />, title: t('support.suggestions.pro.proposalStatus'), description: t('support.suggestions.pro.proposalStatusDesc'), category: 'proposals' },
          { id: 'improve-acceptance', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.pro.improveAcceptance'), description: t('support.suggestions.pro.improveAcceptanceDesc'), category: 'proposals' },
        ],
        'profile': [
          { id: 'complete-profile', icon: <User className="w-4 h-4" />, title: t('support.suggestions.pro.completeProfile'), description: t('support.suggestions.pro.completeProfileDesc'), category: 'profile' },
          { id: 'add-portfolio', icon: <FileText className="w-4 h-4" />, title: t('support.suggestions.pro.addPortfolio'), description: t('support.suggestions.pro.addPortfolioDesc'), category: 'profile' },
          { id: 'get-verified', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.pro.getVerified'), description: t('support.suggestions.pro.getVerifiedDesc'), category: 'profile' },
        ],
      },
      company: {
        'employees': [
          { id: 'add-employee', icon: <User className="w-4 h-4" />, title: t('support.suggestions.company.addEmployee'), description: t('support.suggestions.company.addEmployeeDesc'), category: 'employees' },
          { id: 'manage-team', icon: <Building2 className="w-4 h-4" />, title: t('support.suggestions.company.manageTeam'), description: t('support.suggestions.company.manageTeamDesc'), category: 'employees' },
          { id: 'employee-permissions', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.company.permissions'), description: t('support.suggestions.company.permissionsDesc'), category: 'employees' },
        ],
        'job-management': [
          { id: 'post-company-job', icon: <FileText className="w-4 h-4" />, title: t('support.suggestions.company.postJob'), description: t('support.suggestions.company.postJobDesc'), category: 'job-management' },
          { id: 'assign-jobs', icon: <Briefcase className="w-4 h-4" />, title: t('support.suggestions.company.assignJobs'), description: t('support.suggestions.company.assignJobsDesc'), category: 'job-management' },
          { id: 'track-progress', icon: <Search className="w-4 h-4" />, title: t('support.suggestions.company.trackProgress'), description: t('support.suggestions.company.trackProgressDesc'), category: 'job-management' },
        ],
        'company-profile': [
          { id: 'update-company', icon: <Building2 className="w-4 h-4" />, title: t('support.suggestions.company.updateProfile'), description: t('support.suggestions.company.updateProfileDesc'), category: 'company-profile' },
          { id: 'verify-company', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.company.verifyCompany'), description: t('support.suggestions.company.verifyCompanyDesc'), category: 'company-profile' },
          { id: 'company-visibility', icon: <Search className="w-4 h-4" />, title: t('support.suggestions.company.visibility'), description: t('support.suggestions.company.visibilityDesc'), category: 'company-profile' },
        ],
      },
    };

    const commonSuggestions: Record<string, Suggestion[]> = {
      'account': [
        { id: 'update-info', icon: <User className="w-4 h-4" />, title: t('support.suggestions.common.updateInfo'), description: t('support.suggestions.common.updateInfoDesc'), category: 'account' },
        { id: 'change-password', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.common.changePassword'), description: t('support.suggestions.common.changePasswordDesc'), category: 'account' },
        { id: 'delete-account', icon: <AlertCircle className="w-4 h-4" />, title: t('support.suggestions.common.deleteAccount'), description: t('support.suggestions.common.deleteAccountDesc'), category: 'account' },
      ],
      'payment': [
        { id: 'payment-methods', icon: <CreditCard className="w-4 h-4" />, title: t('support.suggestions.common.paymentMethods'), description: t('support.suggestions.common.paymentMethodsDesc'), category: 'payment' },
        { id: 'billing-history', icon: <FileText className="w-4 h-4" />, title: t('support.suggestions.common.billingHistory'), description: t('support.suggestions.common.billingHistoryDesc'), category: 'payment' },
        { id: 'refund', icon: <CreditCard className="w-4 h-4" />, title: t('support.suggestions.common.refund'), description: t('support.suggestions.common.refundDesc'), category: 'payment' },
      ],
      'security': [
        { id: 'two-factor', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.common.twoFactor'), description: t('support.suggestions.common.twoFactorDesc'), category: 'security' },
        { id: 'suspicious-activity', icon: <AlertCircle className="w-4 h-4" />, title: t('support.suggestions.common.suspicious'), description: t('support.suggestions.common.suspiciousDesc'), category: 'security' },
        { id: 'privacy', icon: <Shield className="w-4 h-4" />, title: t('support.suggestions.common.privacy'), description: t('support.suggestions.common.privacyDesc'), category: 'security' },
      ],
      'other': [
        { id: 'contact-support', icon: <MessageCircle className="w-4 h-4" />, title: t('support.suggestions.common.contactSupport'), description: t('support.suggestions.common.contactSupportDesc'), category: 'other' },
        { id: 'report-bug', icon: <AlertCircle className="w-4 h-4" />, title: t('support.suggestions.common.reportBug'), description: t('support.suggestions.common.reportBugDesc'), category: 'other' },
        { id: 'feedback', icon: <MessageCircle className="w-4 h-4" />, title: t('support.suggestions.common.feedback'), description: t('support.suggestions.common.feedbackDesc'), category: 'other' },
      ],
    };

    const roleSuggestions = suggestionMap[userRole]?.[selectedCategory] || [];
    const common = commonSuggestions[selectedCategory] || [];

    return [...roleSuggestions, ...common];
  };

  const getRelatedItems = (): RelatedItem[] => {
    if (!selectedCategory) return [];

    if (userRole === 'client') {
      if (selectedCategory === 'orders' || selectedCategory === 'finding-pro') {
        return [
          { type: 'pro', id: '1', title: 'John Doe', subtitle: 'Interior Designer', image: '' },
          { type: 'pro', id: '2', title: 'Jane Smith', subtitle: 'Plumber', image: '' },
          { type: 'job', id: '3', title: 'Kitchen Renovation', subtitle: 'Posted 2 days ago' },
        ];
      }
    } else if (userRole === 'pro') {
      if (selectedCategory === 'finding-jobs' || selectedCategory === 'proposals') {
        return [
          { type: 'job', id: '1', title: 'Bathroom Remodel', subtitle: 'Budget: 5000 GEL' },
          { type: 'job', id: '2', title: 'Office Painting', subtitle: 'Budget: 2000 GEL' },
          { type: 'order', id: '3', title: 'Kitchen Project', subtitle: 'In Progress' },
        ];
      }
    } else if (userRole === 'company') {
      return [
        { type: 'job', id: '1', title: 'Building Renovation', subtitle: '3 employees assigned' },
        { type: 'company', id: '2', title: 'Team Alpha', subtitle: '5 members' },
      ];
    }

    return [];
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('suggestions');
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    const relatedItems = getRelatedItems();
    if (relatedItems.length > 0) {
      setStep('select-item');
    } else {
      startChat(suggestion);
    }
  };

  const handleItemSelect = (item: RelatedItem | null) => {
    setSelectedItem(item);
    startChat(selectedSuggestion!, item);
  };

  const startChat = (suggestion: Suggestion, item?: RelatedItem | null) => {
    setStep('chat');
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: t('support.chat.welcomeMessage', { topic: suggestion.title }),
      sender: 'support',
      timestamp: new Date(),
      relatedItem: item || undefined,
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('support.chat.autoResponse'),
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, supportMessage]);
    }, 1500);
  };

  const handleBack = () => {
    if (step === 'chat') {
      setStep(selectedItem ? 'select-item' : 'suggestions');
      setMessages([]);
    } else if (step === 'select-item') {
      setStep('suggestions');
      setSelectedItem(null);
    } else if (step === 'suggestions') {
      setStep('category');
      setSelectedCategory(null);
      setSelectedSuggestion(null);
    } else if (step === 'category') {
      setStep('welcome');
    }
  };

  const resetChat = () => {
    setStep('welcome');
    setSelectedCategory(null);
    setSelectedSuggestion(null);
    setSelectedItem(null);
    setMessages([]);
    setInputValue('');
  };

  const getItemIcon = (type: RelatedItem['type']) => {
    switch (type) {
      case 'pro': return <User className="w-4 h-4" />;
      case 'job': return <Briefcase className="w-4 h-4" />;
      case 'order': return <FileText className="w-4 h-4" />;
      case 'company': return <Building2 className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Button - Luxury Style */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 z-40 w-14 h-14 bg-forest-800 dark:bg-primary-400 text-white dark:text-neutral-50 rounded-2xl shadow-luxury dark:shadow-none hover:bg-forest-700 dark:hover:bg-primary-500 transition-all duration-200 ease-out hover:scale-105 hover:-translate-y-1 flex items-center justify-center group ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full animate-pulse" />
      </button>

      {/* Chat Overlay - Luxury Design */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-h-[600px] bg-white dark:bg-dark-card rounded-2xl shadow-luxury dark:shadow-none border border-neutral-100 dark:border-dark-border flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-br from-forest-800 to-forest-700 text-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step !== 'welcome' && (
                  <button onClick={handleBack} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h3 className="font-serif font-semibold text-lg">{t('support.title')}</h3>
                  <p className="text-xs text-primary-200">
                    {step === 'welcome' && t('support.subtitle')}
                    {step === 'category' && t('support.selectCategory')}
                    {step === 'suggestions' && t('support.selectTopic')}
                    {step === 'select-item' && t('support.selectRelated')}
                    {step === 'chat' && t('support.chatting')}
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsOpen(false); resetChat(); }} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-cream-50 dark:bg-dark-bg">
            {/* Welcome Step */}
            {step === 'welcome' && (
              <div className="p-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-forest-800/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <MessageCircle className="w-10 h-10 text-forest-800" />
                  </div>
                  <h4 className="font-serif font-semibold text-xl text-neutral-900 dark:text-neutral-50 mb-2">{t('support.welcome.title')}</h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{t('support.welcome.description')}</p>
                </div>

                <button
                  onClick={() => setStep('category')}
                  className="w-full py-3.5 bg-forest-800 dark:bg-primary-400 text-white dark:text-neutral-50 rounded-xl font-medium hover:bg-forest-700 dark:hover:bg-primary-500 transition-all duration-200 ease-out hover:shadow-luxury dark:hover:shadow-none"
                >
                  {t('support.welcome.startChat')}
                </button>

                <div className="mt-5 text-center">
                  <p className="text-xs text-neutral-400">{t('support.welcome.responseTime')}</p>
                </div>
              </div>
            )}

            {/* Category Selection */}
            {step === 'category' && (
              <div className="p-4 space-y-2">
                {getCategories().map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className="w-full flex items-center gap-4 p-4 bg-white dark:bg-dark-card hover:bg-cream-100 dark:hover:bg-dark-bg rounded-xl transition-all duration-200 ease-out text-left border border-neutral-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-400 hover:shadow-card dark:hover:shadow-none group"
                  >
                    <div className="w-12 h-12 bg-forest-800/5 dark:bg-primary-400/20 rounded-xl flex items-center justify-center text-forest-800 dark:text-primary-400 group-hover:bg-primary-400/20 transition-colors">
                      {category.icon}
                    </div>
                    <span className="font-medium text-neutral-800 dark:text-neutral-50">{category.label}</span>
                    <ChevronLeft className="w-4 h-4 text-neutral-300 dark:text-neutral-600 ml-auto rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {step === 'suggestions' && (
              <div className="p-4 space-y-2">
                {getSuggestions().map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full flex items-start gap-4 p-4 bg-white dark:bg-dark-card hover:bg-cream-100 dark:hover:bg-dark-bg rounded-xl transition-all duration-200 ease-out text-left border border-neutral-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-400 hover:shadow-card dark:hover:shadow-none group"
                  >
                    <div className="w-10 h-10 bg-forest-800/5 dark:bg-primary-400/20 rounded-xl flex items-center justify-center text-forest-800 dark:text-primary-400 flex-shrink-0 group-hover:bg-primary-400/20 transition-colors">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-800 dark:text-neutral-50 text-sm">{suggestion.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{suggestion.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Select Related Item */}
            {step === 'select-item' && (
              <div className="p-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{t('support.relatedItems.description')}</p>

                <div className="space-y-2 mb-4">
                  {getRelatedItems().map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ease-out text-left ${
                        selectedItem?.id === item.id
                          ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-neutral-50 border-forest-800 dark:border-primary-400'
                          : 'bg-white dark:bg-dark-card hover:bg-cream-100 dark:hover:bg-dark-bg border border-neutral-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-400'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedItem?.id === item.id ? 'bg-white/20' : 'bg-forest-800/5'
                      }`}>
                        {item.image ? (
                          <Avatar src={item.image} name={item.title} size="sm" />
                        ) : (
                          <span className={selectedItem?.id === item.id ? 'text-white' : 'text-forest-800'}>
                            {getItemIcon(item.type)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${selectedItem?.id === item.id ? 'text-white dark:text-neutral-50' : 'text-neutral-800 dark:text-neutral-50'}`}>
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className={`text-xs ${selectedItem?.id === item.id ? 'text-white/70 dark:text-neutral-50/70' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleItemSelect(null)}
                  className="w-full py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-forest-800 dark:hover:text-primary-400 transition-colors font-medium"
                >
                  {t('support.relatedItems.skip')}
                </button>
              </div>
            )}

            {/* Chat */}
            {step === 'chat' && (
              <div className="flex flex-col h-[400px]">
                {/* Selected Item Banner */}
                {selectedItem && (
                  <div className="flex-shrink-0 p-4 bg-white dark:bg-dark-card border-b border-neutral-100 dark:border-dark-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-forest-800/5 dark:bg-primary-400/20 rounded-xl flex items-center justify-center text-forest-800 dark:text-primary-400">
                        {getItemIcon(selectedItem.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-50">{selectedItem.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{selectedItem.subtitle}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 ${
                          message.sender === 'user'
                            ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-neutral-50 rounded-2xl rounded-br-md'
                            : 'bg-white dark:bg-dark-card text-neutral-800 dark:text-neutral-50 rounded-2xl rounded-bl-md border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-1.5 ${message.sender === 'user' ? 'text-white/60 dark:text-neutral-50/60' : 'text-neutral-400'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-dark-card px-4 py-3 rounded-2xl rounded-bl-md border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-forest-800/30 dark:bg-primary-400/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-forest-800/30 dark:bg-primary-400/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-forest-800/30 dark:bg-primary-400/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex-shrink-0 p-4 border-t border-neutral-100 dark:border-dark-border bg-white dark:bg-dark-card">
                  <div className="flex gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t('support.chat.placeholder')}
                      className="flex-1 px-4 py-3 bg-cream-50 dark:bg-dark-bg rounded-xl text-sm text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-forest-800/20 dark:focus:ring-primary-400/20 border border-neutral-100 dark:border-dark-border focus:border-forest-800 dark:focus:border-primary-400 transition-all duration-200 ease-out"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="w-12 h-12 bg-forest-800 dark:bg-primary-400 text-white dark:text-neutral-50 rounded-xl flex items-center justify-center hover:bg-forest-700 dark:hover:bg-primary-500 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-luxury dark:hover:shadow-none"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
