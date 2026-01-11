'use client';

import AuthGuard from '@/components/common/AuthGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics, AnalyticsEvent } from '@/hooks/useAnalytics';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ArrowLeft, Check, CreditCard, Shield, Lock, Sparkles, Star, Zap, Crown,
  ChevronDown, CheckCircle2, ShieldCheck, BadgeCheck,
  ArrowRight, Clock, RefreshCw, Gem, CreditCard as CardIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback } from 'react';

// Types for saved payment methods
interface SavedPaymentMethod {
  id: string;
  type: 'card';
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardholderName?: string;
  isDefault: boolean;
  createdAt: string;
}

// Luxurious color palette
const COLORS = {
  gold: "#D4AF37",
  goldLight: "#E8C547",
  goldDark: "#B8962F",
  terracotta: "#C4735B",
  terracottaLight: "#D4897A",
  terracottaDark: "#A85D4A",
};

// Premium tier configuration
const PREMIUM_TIERS: Record<string, {
  id: string;
  name: { en: string; ka: string };
  tagline: { en: string; ka: string };
  price: { monthly: number; yearly: number };
  currency: string;
  icon: React.ElementType;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  features: { en: string; ka: string }[];
}> = {
  basic: {
    id: 'basic',
    name: { en: 'Premium', ka: 'პრემიუმ' },
    tagline: { en: 'Stand out from the crowd', ka: 'გამოირჩიე სხვებისგან' },
    price: { monthly: 29, yearly: 290 },
    currency: '₾',
    icon: Star,
    accentColor: '#4A9B9B',
    gradientFrom: '#4A9B9B',
    gradientTo: '#3D8585',
    glowColor: 'rgba(74, 155, 155, 0.3)',
    features: [
      { en: 'Premium Badge', ka: 'პრემიუმ ბეჯი' },
      { en: '2x Profile Views', ka: '2x ნახვა' },
      { en: 'Priority Search', ka: 'პრიორიტეტული ძიება' },
      { en: 'Direct Messaging', ka: 'პირდაპირი შეტყობინებები' },
    ],
  },
  pro: {
    id: 'pro',
    name: { en: 'Pro', ka: 'პრო' },
    tagline: { en: 'For serious professionals', ka: 'სერიოზული პროფესიონალებისთვის' },
    price: { monthly: 59, yearly: 590 },
    currency: '₾',
    icon: Zap,
    accentColor: COLORS.terracotta,
    gradientFrom: COLORS.terracotta,
    gradientTo: COLORS.terracottaDark,
    glowColor: 'rgba(196, 115, 91, 0.35)',
    features: [
      { en: 'Pro Badge & Verification', ka: 'პრო ბეჯი და ვერიფიკაცია' },
      { en: '5x Profile Views', ka: '5x ნახვა' },
      { en: 'Featured on Homepage', ka: 'მთავარ გვერდზე' },
      { en: 'Priority Support', ka: 'პრიორიტეტული მხარდაჭერა' },
      { en: 'Unlimited Portfolio', ka: 'შეუზღუდავი პორტფოლიო' },
    ],
  },
  elite: {
    id: 'elite',
    name: { en: 'Elite', ka: 'ელიტა' },
    tagline: { en: 'Maximum visibility & trust', ka: 'მაქსიმალური ხილვადობა' },
    price: { monthly: 99, yearly: 990 },
    currency: '₾',
    icon: Gem,
    accentColor: COLORS.gold,
    gradientFrom: COLORS.gold,
    gradientTo: COLORS.goldDark,
    glowColor: 'rgba(212, 175, 55, 0.4)',
    features: [
      { en: 'Elite Gold Badge', ka: 'ელიტა ოქროს ბეჯი' },
      { en: '10x Profile Views', ka: '10x ნახვა' },
      { en: 'Dedicated Manager', ka: 'პერსონალური მენეჯერი' },
      { en: 'Custom Profile Design', ka: 'პერსონალური დიზაინი' },
      { en: 'WhatsApp Support', ka: 'WhatsApp მხარდაჭერა' },
    ],
  },
};

function CheckoutContent() {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tierId = searchParams.get('tier') || 'pro';
  const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'yearly';

  const tier = PREMIUM_TIERS[tierId];
  const TierIcon = tier?.icon || Zap;
  const price = tier?.price[period] || 0;
  const isElite = tierId === 'elite';

  // Card-only payments
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [isLoadingSavedCards, setIsLoadingSavedCards] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(true);
  const [showCardDropdown, setShowCardDropdown] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch saved payment methods
  const fetchSavedCards = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingSavedCards(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const cards = data.filter((pm: SavedPaymentMethod) => pm.type === 'card');
        setSavedCards(cards);

        const defaultCard = cards.find((c: SavedPaymentMethod) => c.isDefault);
        if (defaultCard) {
          setSelectedSavedCard(defaultCard.id);
        } else if (cards.length > 0) {
          setSelectedSavedCard(cards[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching saved cards:', error);
    } finally {
      setIsLoadingSavedCards(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSavedCards();
  }, [fetchSavedCards]);

  // Save new card to user's payment methods
  const saveCardToAccount = async () => {
    if (!isAuthenticated || !saveNewCard) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      await fetch(`${API_URL}/users/payment-methods/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'card',
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          cardExpiry: formData.cardExpiry,
          cardholderName: formData.cardName,
          setAsDefault: savedCards.length === 0,
        }),
      });
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'cardExpiry') {
      formattedValue = formatExpiry(value.replace('/', ''));
    } else if (field === 'cardCvc') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (useNewCard && saveNewCard) {
      await saveCardToAccount();
    }

    trackEvent(AnalyticsEvent.PREMIUM_PURCHASE, {
      planType: tierId,
      planPrice: price,
    });

    router.push('/pro/premium/success?tier=' + tierId);
  };

  if (!tier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{locale === 'ka' ? 'გეგმა ვერ მოიძებნა' : 'Plan not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Custom Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-15px) rotate(5deg); opacity: 0.5; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <Header />
      <HeaderSpacer />

      <main className={`relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-0 right-1/4 w-[800px] h-[800px] rounded-full blur-[200px] opacity-30"
            style={{ background: `radial-gradient(circle, ${tier.accentColor}30 0%, transparent 70%)` }}
          />
          <div 
            className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
            style={{ background: `radial-gradient(circle, ${tier.accentColor}20 0%, transparent 70%)` }}
          />
          
          {/* Floating sparkles for elite */}
          {isElite && [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            >
              <Sparkles className="text-amber-400/30" style={{ width: `${12 + Math.random() * 8}px` }} />
            </div>
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Back Link */}
          <Link
            href="/pro/premium"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {locale === 'ka' ? 'უკან გეგმებზე' : 'Back to plans'}
          </Link>

          {/* Checkout Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {[
              { num: 1, label: locale === 'ka' ? 'გეგმა' : 'Plan', done: true },
              { num: 2, label: locale === 'ka' ? 'გადახდა' : 'Payment', done: false, active: true },
              { num: 3, label: locale === 'ka' ? 'დასრულება' : 'Complete', done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step.done 
                        ? 'text-white' 
                        : step.active 
                          ? 'text-white shadow-lg' 
                          : 'bg-neutral-100 text-neutral-400'
                    }`}
                    style={{ 
                      background: step.done || step.active 
                        ? `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})` 
                        : undefined,
                      boxShadow: step.active ? `0 4px 20px ${tier.glowColor}` : undefined,
                    }}
                  >
                    {step.done ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    step.done || step.active ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && (
                  <div 
                    className={`w-12 h-0.5 rounded-full ${step.done ? '' : 'bg-neutral-200'}`}
                    style={{ background: step.done ? `linear-gradient(to right, ${tier.gradientFrom}, ${tier.gradientTo})` : undefined }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Page Title */}
          <div className="text-center mb-10">
            <h1 
              className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {locale === 'ka' ? 'დაასრულე შენი შეკვეთა' : 'Complete Your Order'}
            </h1>
            <p className="text-neutral-500">
              {locale === 'ka' ? 'მზად ხარ ბიზნესის გასაზრდელად' : "You're one step away from growing your business"}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Payment Form - Left Side */}
            <div className="lg:col-span-3 lg:order-1">
              <div className="relative">
                {/* Card glow effect */}
                <div 
                  className="absolute -inset-1 rounded-[2rem] blur-xl opacity-30 animate-glow"
                  style={{ background: `linear-gradient(135deg, ${tier.gradientFrom}40, ${tier.gradientTo}40)` }}
                />
                
                <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-2xl overflow-hidden">
                  {/* Form Header */}
                  <div 
                    className="p-6 sm:p-8 border-b border-neutral-100 dark:border-neutral-800"
                    style={{ background: `linear-gradient(135deg, ${tier.accentColor}08, transparent)` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                          boxShadow: `0 8px 32px ${tier.glowColor}`,
                        }}
                      >
                        <CreditCard className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                          {locale === 'ka' ? 'გადახდის დეტალები' : 'Payment Details'}
                        </h2>
                        <p className="text-sm text-neutral-500">
                          {locale === 'ka' ? 'უსაფრთხო გადახდა SSL-ით' : 'Secure payment with SSL encryption'}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">SSL</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Saved Cards Section */}
                      {isAuthenticated && isLoadingSavedCards ? (
                        <div className="flex items-center justify-center py-12">
                          <LoadingSpinner size="lg" color={tier.accentColor} />
                        </div>
                      ) : isAuthenticated && savedCards.length > 0 && !useNewCard ? (
                        <div className="space-y-5">
                          <label className="block text-sm font-semibold text-neutral-900 dark:text-white">
                            {locale === 'ka' ? 'შენახული ბარათები' : 'Saved Cards'}
                          </label>

                          {/* Saved Card Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCardDropdown(!showCardDropdown)}
                              className="w-full p-5 rounded-2xl border-2 bg-white dark:bg-neutral-800 flex items-center justify-between transition-all duration-300"
                              style={{ 
                                borderColor: showCardDropdown ? tier.accentColor : 'rgb(229 231 235)',
                                boxShadow: showCardDropdown ? `0 0 0 4px ${tier.accentColor}15` : undefined,
                              }}
                            >
                              {selectedSavedCard ? (
                                <div className="flex items-center gap-4">
                                  <div
                                    className="w-14 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                    style={{
                                      background: savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Visa' 
                                        ? 'linear-gradient(135deg, #1A1F71, #0E1242)' 
                                        : savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Mastercard' 
                                          ? 'linear-gradient(135deg, #EB001B, #F79E1B)' 
                                          : 'linear-gradient(135deg, #6B7280, #4B5563)',
                                    }}
                                  >
                                    {savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Visa' ? 'VISA' :
                                      savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Mastercard' ? 'MC' : 'CARD'}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-neutral-900 dark:text-white font-mono tracking-wider">
                                      •••• •••• •••• {savedCards.find(c => c.id === selectedSavedCard)?.cardLast4}
                                    </span>
                                    <p className="text-sm text-neutral-500 mt-0.5">
                                      {locale === 'ka' ? 'ვადა' : 'Expires'}: {savedCards.find(c => c.id === selectedSavedCard)?.cardExpiry}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-neutral-400">
                                  {locale === 'ka' ? 'აირჩიეთ ბარათი' : 'Select a card'}
                                </span>
                              )}
                              <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${showCardDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showCardDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xl overflow-hidden">
                                {savedCards.map((card) => (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSavedCard(card.id);
                                      setShowCardDropdown(false);
                                    }}
                                    className={`w-full p-4 flex items-center gap-4 transition-colors ${
                                      selectedSavedCard === card.id 
                                        ? 'bg-neutral-50 dark:bg-neutral-700' 
                                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                    }`}
                                  >
                                    <div
                                      className="w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                      style={{
                                        background: card.cardBrand === 'Visa' 
                                          ? 'linear-gradient(135deg, #1A1F71, #0E1242)' 
                                          : card.cardBrand === 'Mastercard' 
                                            ? 'linear-gradient(135deg, #EB001B, #F79E1B)' 
                                            : 'linear-gradient(135deg, #6B7280, #4B5563)',
                                      }}
                                    >
                                      {card.cardBrand === 'Visa' ? 'VISA' : card.cardBrand === 'Mastercard' ? 'MC' : 'CARD'}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <span className="font-medium text-neutral-900 dark:text-white font-mono">
                                        •••• {card.cardLast4}
                                      </span>
                                      <span className="text-xs text-neutral-500 ml-2">
                                        {card.cardholderName}
                                      </span>
                                    </div>
                                    {card.isDefault && (
                                      <span
                                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: `${tier.accentColor}15`, color: tier.accentColor }}
                                      >
                                        {locale === 'ka' ? 'მთავარი' : 'Default'}
                                      </span>
                                    )}
                                    {selectedSavedCard === card.id && (
                                      <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ background: tier.accentColor }}
                                      >
                                        <Check className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* CVC for saved card */}
                          <div>
                            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                              {locale === 'ka' ? 'უსაფრთხოების კოდი' : 'Security Code'} (CVC)
                            </label>
                            <div className="relative max-w-[160px]">
                              <input
                                type="text"
                                value={formData.cardCvc}
                                onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                                placeholder="•••"
                                maxLength={4}
                                className="w-full px-5 py-4 rounded-xl border-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-lg font-mono tracking-widest focus:outline-none transition-all duration-300 text-center"
                                style={{
                                  borderColor: focusedField === 'cardCvc' ? tier.accentColor : 'rgb(229 231 235)',
                                  boxShadow: focusedField === 'cardCvc' ? `0 0 0 4px ${tier.accentColor}15` : undefined,
                                }}
                                onFocus={() => setFocusedField('cardCvc')}
                                onBlur={() => setFocusedField(null)}
                                required
                              />
                              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            </div>
                          </div>

                          {/* Use new card button */}
                          <button
                            type="button"
                            onClick={() => setUseNewCard(true)}
                            className="text-sm font-semibold transition-all flex items-center gap-2 hover:gap-3"
                            style={{ color: tier.accentColor }}
                          >
                            <CreditCard className="w-4 h-4" />
                            {locale === 'ka' ? 'ახალი ბარათით გადახდა' : 'Use a different card'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Back to saved cards button if has saved cards */}
                          {isAuthenticated && savedCards.length > 0 && useNewCard && (
                            <button
                              type="button"
                              onClick={() => setUseNewCard(false)}
                              className="text-sm font-semibold transition-all flex items-center gap-2 mb-4 hover:gap-3"
                              style={{ color: tier.accentColor }}
                            >
                              <ArrowLeft className="w-4 h-4" />
                              {locale === 'ka' ? 'შენახულ ბარათებზე დაბრუნება' : 'Back to saved cards'}
                            </button>
                          )}

                          {/* Card Number */}
                          <div>
                            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                              {locale === 'ka' ? 'ბარათის ნომერი' : 'Card Number'}
                            </label>
                            <div className="relative">
                              <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center pointer-events-none">
                                <div
                                  className="w-11 h-7 rounded-lg flex items-center justify-center"
                                  style={{ 
                                    background: focusedField === 'cardNumber' 
                                      ? `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})` 
                                      : `${tier.accentColor}15`,
                                  }}
                                >
                                  <CardIcon className="w-5 h-5" style={{ color: focusedField === 'cardNumber' ? 'white' : tier.accentColor }} />
                                </div>
                              </div>
                              <input
                                type="text"
                                value={formData.cardNumber}
                                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                                className="w-full pl-20 pr-5 py-4 rounded-xl border-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-lg font-mono tracking-wider focus:outline-none transition-all duration-300"
                                style={{
                                  borderColor: focusedField === 'cardNumber' ? tier.accentColor : 'rgb(229 231 235)',
                                  boxShadow: focusedField === 'cardNumber' ? `0 0 0 4px ${tier.accentColor}15` : undefined,
                                }}
                                onFocus={() => setFocusedField('cardNumber')}
                                onBlur={() => setFocusedField(null)}
                                required
                              />
                            </div>
                          </div>

                          {/* Expiry and CVC */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                                {locale === 'ka' ? 'ვადა' : 'Expiry Date'}
                              </label>
                              <input
                                type="text"
                                value={formData.cardExpiry}
                                onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                                placeholder="MM / YY"
                                maxLength={5}
                                className="w-full px-5 py-4 rounded-xl border-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-lg font-mono text-center focus:outline-none transition-all duration-300"
                                style={{
                                  borderColor: focusedField === 'cardExpiry' ? tier.accentColor : 'rgb(229 231 235)',
                                  boxShadow: focusedField === 'cardExpiry' ? `0 0 0 4px ${tier.accentColor}15` : undefined,
                                }}
                                onFocus={() => setFocusedField('cardExpiry')}
                                onBlur={() => setFocusedField(null)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                                CVC
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={formData.cardCvc}
                                  onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                                  placeholder="•••"
                                  maxLength={4}
                                  className="w-full px-5 py-4 rounded-xl border-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-lg font-mono text-center focus:outline-none transition-all duration-300"
                                  style={{
                                    borderColor: focusedField === 'cardCvc' ? tier.accentColor : 'rgb(229 231 235)',
                                    boxShadow: focusedField === 'cardCvc' ? `0 0 0 4px ${tier.accentColor}15` : undefined,
                                  }}
                                  onFocus={() => setFocusedField('cardCvc')}
                                  onBlur={() => setFocusedField(null)}
                                  required
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                              </div>
                            </div>
                          </div>

                          {/* Card Name */}
                          <div>
                            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                              {locale === 'ka' ? 'სახელი ბარათზე' : 'Cardholder Name'}
                            </label>
                            <input
                              type="text"
                              value={formData.cardName}
                              onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                              placeholder={locale === 'ka' ? 'სახელი გვარი' : 'John Doe'}
                              className="w-full px-5 py-4 rounded-xl border-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none transition-all duration-300"
                              style={{
                                borderColor: focusedField === 'cardName' ? tier.accentColor : 'rgb(229 231 235)',
                                boxShadow: focusedField === 'cardName' ? `0 0 0 4px ${tier.accentColor}15` : undefined,
                              }}
                              onFocus={() => setFocusedField('cardName')}
                              onBlur={() => setFocusedField(null)}
                              required
                            />
                          </div>

                          {/* Save card checkbox */}
                          {isAuthenticated && (
                            <label 
                              className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300"
                              style={{
                                borderColor: saveNewCard ? tier.accentColor : 'rgb(229 231 235)',
                                background: saveNewCard ? `${tier.accentColor}05` : undefined,
                              }}
                            >
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={saveNewCard}
                                  onChange={(e) => setSaveNewCard(e.target.checked)}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                    saveNewCard ? '' : 'border-2 border-neutral-300'
                                  }`}
                                  style={saveNewCard ? { background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})` } : {}}
                                >
                                  {saveNewCard && <Check className="w-4 h-4 text-white" />}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" style={{ color: tier.accentColor }} />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  {locale === 'ka' ? 'ბარათის შენახვა მომავალი გადახდებისთვის' : 'Save card for future purchases'}
                                </span>
                              </div>
                            </label>
                          )}
                        </>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="relative w-full py-5 px-8 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                          boxShadow: `0 12px 40px ${tier.glowColor}`,
                        }}
                      >
                        {/* Shine effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                          }}
                        />
                        
                        <span className="relative z-10 flex items-center gap-3">
                          {isProcessing ? (
                            <>
                              <LoadingSpinner size="md" color="white" />
                              <span>{locale === 'ka' ? 'მუშავდება...' : 'Processing...'}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5" />
                              <span>
                                {locale === 'ka' ? `გადაიხადე ${tier.currency}${price}` : `Pay ${tier.currency}${price}`}
                              </span>
                              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </span>
                      </button>

                      {/* Terms */}
                      <p className="text-xs text-center text-neutral-400 leading-relaxed">
                        {locale === 'ka'
                          ? 'გადახდით თქვენ ეთანხმებით ჩვენს მომსახურების პირობებს და კონფიდენციალურობის პოლიტიკას'
                          : 'By completing payment, you agree to our Terms of Service and Privacy Policy'}
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary - Right Side */}
            <div className="lg:col-span-2 lg:order-2">
              <div className="sticky top-24 space-y-6">
                {/* Plan Summary Card */}
                <div className="relative">
                  {/* Card glow */}
                  <div 
                    className="absolute -inset-1 rounded-[2rem] blur-xl opacity-40"
                    style={{ background: `linear-gradient(135deg, ${tier.gradientFrom}60, ${tier.gradientTo}60)` }}
                  />
                  
                  <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-2xl overflow-hidden">
                    {/* Plan Header with Gradient */}
                    <div
                      className="p-6 text-white relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${tier.gradientFrom} 0%, ${tier.gradientTo} 100%)` }}
                    >
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                      
                      {isElite && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          {[...Array(5)].map((_, i) => (
                            <Sparkles 
                              key={i} 
                              className="absolute text-white/20 animate-float"
                              style={{
                                left: `${20 + i * 15}%`,
                                top: `${20 + (i % 3) * 25}%`,
                                width: '16px',
                                animationDelay: `${i * 0.5}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <TierIcon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 
                              className="text-2xl font-bold"
                              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                              {tier.name[locale === 'ka' ? 'ka' : 'en']}
                            </h3>
                            <p className="text-sm text-white/80">{tier.tagline[locale === 'ka' ? 'ka' : 'en']}</p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span 
                            className="text-5xl font-bold"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                          >
                            {tier.currency}{price}
                          </span>
                          <span className="text-white/70 text-lg">
                            /{period === 'monthly' ? (locale === 'ka' ? 'თვე' : 'mo') : (locale === 'ka' ? 'წელი' : 'yr')}
                          </span>
                        </div>

                        {period === 'yearly' && (
                          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            {locale === 'ka' ? `დაზოგე ${tier.currency}${tier.price.monthly * 12 - price}` : `Save ${tier.currency}${tier.price.monthly * 12 - price}/year`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="p-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
                        {locale === 'ka' ? 'მოიცავს' : 'Includes'}
                      </h4>
                      <ul className="space-y-3">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 group">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                              style={{ backgroundColor: `${tier.accentColor}15` }}
                            >
                              <Check className="w-3.5 h-3.5" style={{ color: tier.accentColor }} />
                            </div>
                            <span className="text-sm text-neutral-600 dark:text-neutral-300">
                              {feature[locale === 'ka' ? 'ka' : 'en']}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Shield, text: { en: '7-Day Guarantee', ka: '7 დღის გარანტია' }, color: '#10B981' },
                    { icon: Lock, text: { en: 'SSL Encrypted', ka: 'SSL დაცვა' }, color: '#6366F1' },
                    { icon: RefreshCw, text: { en: 'Cancel Anytime', ka: 'გაუქმება ნებისმიერ დროს' }, color: '#F59E0B' },
                    { icon: ShieldCheck, text: { en: 'PCI Compliant', ka: 'PCI სტანდარტი' }, color: '#8B5CF6' },
                  ].map((badge, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${badge.color}15` }}
                      >
                        <badge.icon className="w-4 h-4" style={{ color: badge.color }} />
                      </div>
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                        {badge.text[locale === 'ka' ? 'ka' : 'en']}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700 shadow-sm">
                  <div className="flex -space-x-2">
                    {['NM', 'GT', 'DK', 'LS'].map((initials, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border-2 border-white dark:border-neutral-800 flex items-center justify-center text-white text-xs font-bold shadow-md"
                        style={{ 
                          background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                          opacity: 1 - i * 0.1,
                          zIndex: 4 - i,
                        }}
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-neutral-900 dark:text-white">500+</span>
                    <span className="text-neutral-500"> {locale === 'ka' ? 'პროფესიონალი' : 'professionals'}</span>
                  </div>
                </div>

                {/* Support */}
                <div className="text-center">
                  <p className="text-xs text-neutral-400">
                    {locale === 'ka' ? 'გჭირდებათ დახმარება?' : 'Need help?'}{' '}
                    <a href="mailto:support@homico.ge" className="font-medium hover:underline" style={{ color: tier.accentColor }}>
                      support@homico.ge
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  const tier = PREMIUM_TIERS['pro'];
  
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-white">
          <div className="flex flex-col items-center gap-6">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl"
              style={{ 
                background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                boxShadow: `0 12px 40px ${tier.glowColor}`,
              }}
            >
              <Lock className="w-10 h-10 text-white" />
            </div>
            <LoadingSpinner size="lg" color={tier.accentColor} />
            <p className="text-sm text-neutral-500">Loading secure checkout...</p>
          </div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </AuthGuard>
  );
}
