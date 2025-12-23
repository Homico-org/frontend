'use client';

import AuthGuard from '@/components/common/AuthGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics, AnalyticsEvent } from '@/hooks/useAnalytics';
import Header, { HeaderSpacer } from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import {
  ArrowLeft, Check, CreditCard, Shield, Lock, Sparkles, Star, Zap, Crown,
  Loader2, ChevronDown, CheckCircle2, ShieldCheck, BadgeCheck,
  ArrowRight, Users, Clock, RefreshCw
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

// Premium tier configuration
const PREMIUM_TIERS: Record<string, {
  id: string;
  name: { en: string; ka: string };
  tagline: { en: string; ka: string };
  price: { monthly: number; yearly: number };
  currency: string;
  icon: React.ElementType;
  accentColor: string;
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
    features: [
      { en: 'Premium Badge', ka: 'პრემიუმ ბეჯი' },
      { en: '2x Profile Views', ka: '2x ნახვა' },
      { en: 'Priority Search', ka: 'პრიორიტეტული ძიება' },
    ],
  },
  pro: {
    id: 'pro',
    name: { en: 'Pro', ka: 'პრო' },
    tagline: { en: 'For serious professionals', ka: 'სერიოზული პროფესიონალებისთვის' },
    price: { monthly: 59, yearly: 590 },
    currency: '₾',
    icon: Zap,
    accentColor: '#E07B4F',
    features: [
      { en: 'Pro Badge & Verification', ka: 'პრო ბეჯი და ვერიფიკაცია' },
      { en: '5x Profile Views', ka: '5x ნახვა' },
      { en: 'Featured on Homepage', ka: 'მთავარ გვერდზე' },
      { en: 'Priority Support', ka: 'პრიორიტეტული მხარდაჭერა' },
    ],
  },
  elite: {
    id: 'elite',
    name: { en: 'Elite', ka: 'ელიტა' },
    tagline: { en: 'Maximum visibility & trust', ka: 'მაქსიმალური ხილვადობა' },
    price: { monthly: 99, yearly: 990 },
    currency: '₾',
    icon: Crown,
    accentColor: '#B8860B',
    features: [
      { en: 'Elite Gold Badge', ka: 'ელიტა ოქროს ბეჯი' },
      { en: '10x Profile Views', ka: '10x ნახვა' },
      { en: 'Dedicated Manager', ka: 'პერსონალური მენეჯერი' },
      { en: 'Custom Profile Design', ka: 'პერსონალური დიზაინი' },
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

  // Card-only payments
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });
  const [isVisible, setIsVisible] = useState(false);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [isLoadingSavedCards, setIsLoadingSavedCards] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(false);
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
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      <main className={`relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ backgroundColor: `${tier.accentColor}08` }} />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: `${tier.accentColor}05` }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Back Link */}
          <Link
            href="/pro/premium"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {locale === 'ka' ? 'უკან გეგმებზე' : 'Back to plans'}
          </Link>

          {/* Page Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-sm mb-4">
              <Lock className="w-4 h-4" style={{ color: tier.accentColor }} />
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {locale === 'ka' ? 'უსაფრთხო გადახდა' : 'Secure Checkout'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
              {locale === 'ka' ? 'დაასრულე შენი შეკვეთა' : 'Complete Your Order'}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'მზად ხარ ბიზნესის გასაზრდელად' : "You're one step away from growing your business"}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Payment Form - Left Side */}
            <div className="lg:col-span-3 lg:order-1">
              <div className="bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border-subtle)] shadow-xl overflow-hidden">
                {/* Form Header */}
                <div className="p-6 sm:p-8 border-b border-[var(--color-border-subtle)] bg-gradient-to-r from-[var(--color-bg-secondary)] to-transparent">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: tier.accentColor }}
                    >
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'გადახდის დეტალები' : 'Payment Details'}
                      </h2>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {locale === 'ka' ? 'შეიყვანე გადახდის ინფორმაცია' : 'Enter your payment information'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Saved Cards Section */}
                      {isAuthenticated && isLoadingSavedCards ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: tier.accentColor }} />
                        </div>
                      ) : isAuthenticated && savedCards.length > 0 && !useNewCard ? (
                        <div className="space-y-5">
                          <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                            {locale === 'ka' ? 'შენახული ბარათები' : 'Saved Cards'}
                          </label>

                          {/* Saved Card Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCardDropdown(!showCardDropdown)}
                              className="w-full p-5 rounded-2xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] flex items-center justify-between transition-all duration-200"
                              style={{ borderColor: showCardDropdown ? tier.accentColor : undefined }}
                            >
                              {selectedSavedCard ? (
                                <div className="flex items-center gap-4">
                                  <div
                                    className="w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                    style={{
                                      backgroundColor: savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Visa' ? '#1A1F71' :
                                        savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Mastercard' ? '#EB001B' : '#6B7280',
                                    }}
                                  >
                                    {savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Visa' ? 'VISA' :
                                      savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Mastercard' ? 'MC' : 'CARD'}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-[var(--color-text-primary)]">
                                      •••• •••• •••• {savedCards.find(c => c.id === selectedSavedCard)?.cardLast4}
                                    </span>
                                    <span className="text-sm text-[var(--color-text-tertiary)] ml-3">
                                      {locale === 'ka' ? 'ვადა' : 'Exp'}: {savedCards.find(c => c.id === selectedSavedCard)?.cardExpiry}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[var(--color-text-tertiary)]">
                                  {locale === 'ka' ? 'აირჩიეთ ბარათი' : 'Select a card'}
                                </span>
                              )}
                              <ChevronDown className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform ${showCardDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showCardDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-2xl overflow-hidden">
                                {savedCards.map((card) => (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSavedCard(card.id);
                                      setShowCardDropdown(false);
                                    }}
                                    className={`w-full p-4 flex items-center gap-4 transition-colors ${
                                      selectedSavedCard === card.id ? 'bg-[var(--color-bg-secondary)]' : 'hover:bg-[var(--color-bg-secondary)]'
                                    }`}
                                  >
                                    <div
                                      className="w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                      style={{
                                        backgroundColor: card.cardBrand === 'Visa' ? '#1A1F71' :
                                          card.cardBrand === 'Mastercard' ? '#EB001B' : '#6B7280',
                                      }}
                                    >
                                      {card.cardBrand === 'Visa' ? 'VISA' : card.cardBrand === 'Mastercard' ? 'MC' : 'CARD'}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <span className="font-medium text-[var(--color-text-primary)]">
                                        •••• {card.cardLast4}
                                      </span>
                                      <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
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
                                      <Check className="w-5 h-5" style={{ color: tier.accentColor }} />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* CVC for saved card */}
                          <div>
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                              {locale === 'ka' ? 'უსაფრთხოების კოდი' : 'Security Code'} (CVC)
                            </label>
                            <div className="relative max-w-[140px]">
                              <input
                                type="text"
                                value={formData.cardCvc}
                                onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                                placeholder="•••"
                                maxLength={4}
                                className="w-full px-5 py-4 rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-lg font-mono tracking-widest focus:outline-none focus:border-[var(--color-border)] transition-colors text-center"
                                required
                              />
                            </div>
                          </div>

                          {/* Use new card button */}
                          <button
                            type="button"
                            onClick={() => setUseNewCard(true)}
                            className="text-sm font-semibold transition-colors flex items-center gap-2 hover:underline"
                            style={{ color: tier.accentColor }}
                          >
                            <CreditCard className="w-4 h-4" />
                            {locale === 'ka' ? 'ახალი ბარათით გადახდა' : 'Use a different card'}
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Back to saved cards button if has saved cards */}
                          {isAuthenticated && savedCards.length > 0 && useNewCard && (
                            <button
                              type="button"
                              onClick={() => setUseNewCard(false)}
                              className="text-sm font-semibold transition-colors flex items-center gap-2 mb-4 hover:underline"
                              style={{ color: tier.accentColor }}
                            >
                              <ArrowLeft className="w-4 h-4" />
                              {locale === 'ka' ? 'შენახულ ბარათებზე დაბრუნება' : 'Back to saved cards'}
                            </button>
                          )}

                          {/* Card Number */}
                          <div>
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                              {locale === 'ka' ? 'ბარათის ნომერი' : 'Card Number'}
                            </label>
                            <div className="relative">
                              <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center pointer-events-none">
                                <div
                                  className="w-10 h-7 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${tier.accentColor}15` }}
                                >
                                  <CreditCard className="w-5 h-5" style={{ color: tier.accentColor }} />
                                </div>
                              </div>
                              <input
                                type="text"
                                value={formData.cardNumber}
                                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                                className="w-full pl-20 pr-5 py-4 rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-lg font-mono tracking-wider focus:outline-none transition-colors"
                                style={{ ['--tw-ring-color' as string]: tier.accentColor }}
                                onFocus={(e) => e.target.style.borderColor = tier.accentColor}
                                onBlur={(e) => e.target.style.borderColor = ''}
                                required
                              />
                            </div>
                          </div>

                          {/* Expiry and CVC */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                                {locale === 'ka' ? 'ვადა' : 'Expiry Date'}
                              </label>
                              <input
                                type="text"
                                value={formData.cardExpiry}
                                onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                                placeholder="MM / YY"
                                maxLength={5}
                                className="w-full px-5 py-4 rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-lg font-mono text-center focus:outline-none transition-colors"
                                onFocus={(e) => e.target.style.borderColor = tier.accentColor}
                                onBlur={(e) => e.target.style.borderColor = ''}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                                CVC
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={formData.cardCvc}
                                  onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                                  placeholder="•••"
                                  maxLength={4}
                                  className="w-full px-5 py-4 rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-lg font-mono text-center focus:outline-none transition-colors"
                                  onFocus={(e) => e.target.style.borderColor = tier.accentColor}
                                  onBlur={(e) => e.target.style.borderColor = ''}
                                  required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                  <Lock className="w-4 h-4 text-[var(--color-text-quaternary)]" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Name */}
                          <div>
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                              {locale === 'ka' ? 'სახელი ბარათზე' : 'Cardholder Name'}
                            </label>
                            <input
                              type="text"
                              value={formData.cardName}
                              onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                              placeholder={locale === 'ka' ? 'სახელი გვარი' : 'John Doe'}
                              className="w-full px-5 py-4 rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none transition-colors"
                              onFocus={(e) => e.target.style.borderColor = tier.accentColor}
                              onBlur={(e) => e.target.style.borderColor = ''}
                              required
                            />
                          </div>

                          {/* Save card checkbox */}
                          {isAuthenticated && (
                            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={saveNewCard}
                                  onChange={(e) => setSaveNewCard(e.target.checked)}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    saveNewCard ? 'border-transparent' : 'border-[var(--color-border)]'
                                  }`}
                                  style={saveNewCard ? { backgroundColor: tier.accentColor } : {}}
                                >
                                  {saveNewCard && <Check className="w-4 h-4 text-white" />}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" style={{ color: tier.accentColor }} />
                                <span className="text-sm text-[var(--color-text-primary)]">
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
                        className="w-full py-5 px-8 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        style={{
                          backgroundColor: tier.accentColor,
                          boxShadow: `0 10px 40px ${tier.accentColor}40`,
                        }}
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{locale === 'ka' ? 'მუშავდება...' : 'Processing...'}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            <span>
                              {locale === 'ka' ? `გადაიხადე ${tier.currency}${price}` : `Pay ${tier.currency}${price}`}
                            </span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      {/* Terms */}
                      <p className="text-xs text-center text-[var(--color-text-tertiary)] leading-relaxed">
                        {locale === 'ka'
                          ? 'გადახდით თქვენ ეთანხმებით ჩვენს მომსახურების პირობებს და კონფიდენციალურობის პოლიტიკას'
                          : 'By completing payment, you agree to our Terms of Service and Privacy Policy'}
                      </p>
                    </form>
                </div>
              </div>
            </div>

            {/* Order Summary - Right Side */}
            <div className="lg:col-span-2 lg:order-2">
              <div className="sticky top-24 space-y-6">
                {/* Plan Summary Card */}
                <div className="bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border-subtle)] shadow-xl overflow-hidden">
                  {/* Plan Header with Gradient */}
                  <div
                    className="p-6 text-white relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${tier.accentColor} 0%, ${tier.accentColor}CC 100%)` }}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <TierIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{tier.name[locale === 'ka' ? 'ka' : 'en']}</h3>
                          <p className="text-sm text-white/80">{tier.tagline[locale === 'ka' ? 'ka' : 'en']}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{tier.currency}{price}</span>
                        <span className="text-white/70">
                          /{period === 'monthly' ? (locale === 'ka' ? 'თვე' : 'mo') : (locale === 'ka' ? 'წელი' : 'yr')}
                        </span>
                      </div>

                      {period === 'yearly' && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          {locale === 'ka' ? `დაზოგე ${tier.currency}${tier.price.monthly * 12 - price}` : `Save ${tier.currency}${tier.price.monthly * 12 - price}/year`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">
                      {locale === 'ka' ? 'მოიცავს' : 'Includes'}
                    </h4>
                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${tier.accentColor}15` }}
                          >
                            <Check className="w-3 h-3" style={{ color: tier.accentColor }} />
                          </div>
                          <span className="text-sm text-[var(--color-text-secondary)]">
                            {feature[locale === 'ka' ? 'ka' : 'en']}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Shield, text: { en: '7-Day Guarantee', ka: '7 დღის გარანტია' }, color: '#10B981' },
                    { icon: Lock, text: { en: 'SSL Encrypted', ka: 'SSL დაცვა' }, color: '#6366F1' },
                    { icon: RefreshCw, text: { en: 'Cancel Anytime', ka: 'გაუქმება' }, color: '#F59E0B' },
                    { icon: ShieldCheck, text: { en: 'PCI Compliant', ka: 'PCI სტანდარტი' }, color: '#8B5CF6' },
                  ].map((badge, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${badge.color}15` }}
                      >
                        <badge.icon className="w-4 h-4" style={{ color: badge.color }} />
                      </div>
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        {badge.text[locale === 'ka' ? 'ka' : 'en']}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-[var(--color-bg-elevated)] flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: tier.accentColor, opacity: 1 - i * 0.15 }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-[var(--color-text-primary)]">500+</span>
                    <span className="text-[var(--color-text-tertiary)]"> {locale === 'ka' ? 'პროფესიონალი' : 'professionals'}</span>
                  </div>
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
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E07B4F] flex items-center justify-center animate-pulse shadow-lg shadow-[#E07B4F]/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#E07B4F] border-t-transparent" />
            <p className="text-sm text-[var(--color-text-tertiary)]">Loading checkout...</p>
          </div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </AuthGuard>
  );
}
