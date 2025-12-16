'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/common/Header';
import { ArrowLeft, Check, CreditCard, Shield, Lock, Sparkles, Star, Zap, Crown, Building2, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback } from 'react';

// Types for saved payment methods
interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank';
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardholderName?: string;
  bankName?: string;
  maskedIban?: string;
  isDefault: boolean;
  createdAt: string;
}

// Premium tier configuration - solid terracotta
const PREMIUM_TIERS: Record<string, {
  id: string;
  name: { en: string; ka: string };
  price: { monthly: number; yearly: number };
  currency: string;
  icon: React.ElementType;
}> = {
  basic: {
    id: 'basic',
    name: { en: 'Premium', ka: 'პრემიუმ' },
    price: { monthly: 29, yearly: 290 },
    currency: '₾',
    icon: Star,
  },
  pro: {
    id: 'pro',
    name: { en: 'Pro', ka: 'პრო' },
    price: { monthly: 59, yearly: 590 },
    currency: '₾',
    icon: Zap,
  },
  elite: {
    id: 'elite',
    name: { en: 'Elite', ka: 'ელიტა' },
    price: { monthly: 99, yearly: 990 },
    currency: '₾',
    icon: Crown,
  },
};

function CheckoutContent() {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tierId = searchParams.get('tier') || 'basic';
  const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'yearly';

  const tier = PREMIUM_TIERS[tierId];
  const TierIcon = tier?.icon || Star;
  const price = tier?.price[period] || 0;

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [isLoadingSavedCards, setIsLoadingSavedCards] = useState(false);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [showCardDropdown, setShowCardDropdown] = useState(false);

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

        // Auto-select default card if available
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
          setAsDefault: savedCards.length === 0, // Set as default if first card
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

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Save card if checkbox is checked and using new card
    if (useNewCard && saveNewCard) {
      await saveCardToAccount();
    }

    // TODO: Implement actual payment processing
    // For now, redirect to success page
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
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <Header />

      <main className="relative overflow-hidden">
        {/* Background Elements - solid terracotta */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#E07B4F]/8 blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#E07B4F]/8 blur-[80px]" />
        </div>

        <div className="relative container-custom py-8 sm:py-12">
          {/* Back Link */}
          <Link
            href="/pro/premium"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {locale === 'ka' ? 'უკან გეგმებზე' : 'Back to plans'}
          </Link>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Order Summary - Right Side on Desktop */}
            <div className="lg:col-span-2 lg:order-2">
              <div className="checkout-summary-card sticky top-24">
                <div className="p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
                    {locale === 'ka' ? 'შეკვეთის დეტალები' : 'Order Summary'}
                  </h2>

                  {/* Plan Card */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl checkout-plan-badge mb-6">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#E07B4F] shadow-lg shadow-[#E07B4F]/25">
                      <TierIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--color-text-primary)] text-lg">
                        {tier.name[locale === 'ka' ? 'ka' : 'en']}
                      </p>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {period === 'monthly' ? (locale === 'ka' ? 'თვიური გეგმა' : 'Monthly plan') : (locale === 'ka' ? 'წლიური გეგმა' : 'Yearly plan')}
                      </p>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">
                        {tier.name[locale === 'ka' ? 'ka' : 'en']} ({period === 'monthly' ? (locale === 'ka' ? 'თვიური' : 'Monthly') : (locale === 'ka' ? 'წლიური' : 'Yearly')})
                      </span>
                      <span className="text-[var(--color-text-primary)] font-medium">{tier.currency}{price}</span>
                    </div>

                    {period === 'yearly' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{locale === 'ka' ? 'წლიური ფასდაკლება' : 'Yearly discount'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">-{tier.currency}{tier.price.monthly * 12 - price}</span>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent mb-6" />

                  <div className="flex justify-between items-baseline mb-8">
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {locale === 'ka' ? 'სულ გადასახდელი' : 'Total due today'}
                    </span>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-[var(--color-text-primary)]">{tier.currency}{price}</span>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        {period === 'yearly' ? (locale === 'ka' ? 'წელიწადში ერთხელ' : 'Billed annually') : (locale === 'ka' ? 'ყოველთვიურად' : 'Billed monthly')}
                      </p>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {locale === 'ka' ? '7 დღიანი თანხის დაბრუნების გარანტია' : '7-day money-back guarantee'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E07B4F]/5 border border-[#E07B4F]/10">
                      <div className="w-8 h-8 rounded-lg bg-[#E07B4F]/10 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-[#E07B4F]" />
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {locale === 'ka' ? '256-bit SSL დაშიფრული გადახდა' : '256-bit SSL encrypted payment'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form - Left Side on Desktop */}
            <div className="lg:col-span-3 lg:order-1">
              <div className="checkout-form-card">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#E07B4F] flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'გადახდა' : 'Checkout'}
                      </h1>
                    </div>
                  </div>
                  <p className="text-[var(--color-text-tertiary)] mb-8 ml-[52px]">
                    {locale === 'ka' ? 'შეიყვანე გადახდის ინფორმაცია' : 'Enter your payment information below'}
                  </p>

                  {/* Payment Method Selection */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                      {locale === 'ka' ? 'გადახდის მეთოდი' : 'Payment Method'}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`checkout-method-btn-terracotta ${paymentMethod === 'card' ? 'active' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          paymentMethod === 'card'
                            ? 'bg-[#E07B4F]'
                            : 'bg-[var(--color-bg-tertiary)]'
                        }`}>
                          <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-white' : 'text-[var(--color-text-tertiary)]'}`} />
                        </div>
                        <div className="text-left">
                          <span className="block font-semibold text-[var(--color-text-primary)]">
                            {locale === 'ka' ? 'ბარათი' : 'Credit Card'}
                          </span>
                          <span className="text-xs text-[var(--color-text-tertiary)]">Visa, Mastercard</span>
                        </div>
                        {paymentMethod === 'card' && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E07B4F] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`checkout-method-btn-terracotta ${paymentMethod === 'bank' ? 'active' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          paymentMethod === 'bank'
                            ? 'bg-[#E07B4F]'
                            : 'bg-[var(--color-bg-tertiary)]'
                        }`}>
                          <Building2 className={`w-5 h-5 ${paymentMethod === 'bank' ? 'text-white' : 'text-[var(--color-text-tertiary)]'}`} />
                        </div>
                        <div className="text-left">
                          <span className="block font-semibold text-[var(--color-text-primary)]">
                            {locale === 'ka' ? 'ბანკი' : 'Bank Transfer'}
                          </span>
                          <span className="text-xs text-[var(--color-text-tertiary)]">TBC, BOG, Liberty</span>
                        </div>
                        {paymentMethod === 'bank' && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E07B4F] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Saved Cards Section */}
                      {isAuthenticated && isLoadingSavedCards ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-6 h-6 animate-spin text-[#E07B4F]" />
                        </div>
                      ) : isAuthenticated && savedCards.length > 0 && !useNewCard ? (
                        <div className="space-y-4">
                          <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                            {locale === 'ka' ? 'შენახული ბარათები' : 'Saved Cards'}
                          </label>

                          {/* Saved Card Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCardDropdown(!showCardDropdown)}
                              className="w-full p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between hover:border-[#E07B4F]/50 transition-colors"
                            >
                              {selectedSavedCard ? (
                                <div className="flex items-center gap-3">
                                  {/* Card Brand */}
                                  <div
                                    className="w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
                                    style={{
                                      backgroundColor: savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Visa' ? '#1A1F71' :
                                        savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Mastercard' ? '#EB001B' : '#6B7280',
                                    }}
                                  >
                                    {savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Visa' ? 'VISA' :
                                      savedCards.find(c => c.id === selectedSavedCard)?.cardBrand === 'Mastercard' ? 'MC' : 'CARD'}
                                  </div>
                                  <div>
                                    <span className="font-medium text-[var(--color-text-primary)]">
                                      •••• {savedCards.find(c => c.id === selectedSavedCard)?.cardLast4}
                                    </span>
                                    <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
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
                              <div className="absolute top-full left-0 right-0 mt-2 z-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-lg overflow-hidden">
                                {savedCards.map((card) => (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSavedCard(card.id);
                                      setShowCardDropdown(false);
                                    }}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-[var(--color-bg-secondary)] transition-colors ${selectedSavedCard === card.id ? 'bg-[#E07B4F]/5' : ''}`}
                                  >
                                    <div
                                      className="w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
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
                                      <span className="text-[10px] font-medium text-[#E07B4F] bg-[#E07B4F]/10 px-2 py-0.5 rounded-full">
                                        {locale === 'ka' ? 'მთავარი' : 'Default'}
                                      </span>
                                    )}
                                    {selectedSavedCard === card.id && (
                                      <Check className="w-4 h-4 text-[#E07B4F]" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* CVC for saved card */}
                          <div>
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                              CVC
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={formData.cardCvc}
                                onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                                placeholder="•••"
                                maxLength={4}
                                className="checkout-input-v2-terracotta !pr-12"
                                required
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Lock className="w-4 h-4 text-[var(--color-text-quaternary)]" />
                              </div>
                            </div>
                          </div>

                          {/* Use new card button */}
                          <button
                            type="button"
                            onClick={() => setUseNewCard(true)}
                            className="text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F] transition-colors flex items-center gap-2"
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
                              className="text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F] transition-colors flex items-center gap-2 mb-4"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              {locale === 'ka' ? 'შენახულ ბარათებზე დაბრუნება' : 'Back to saved cards'}
                            </button>
                          )}

                          {/* Card Number - Fixed icon overlap */}
                          <div>
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                              {locale === 'ka' ? 'ბარათის ნომერი' : 'Card Number'}
                            </label>
                            <div className="relative">
                              <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-6 rounded bg-[#E07B4F]/10 flex items-center justify-center">
                                  <CreditCard className="w-4 h-4 text-[#E07B4F]" />
                                </div>
                              </div>
                              <input
                                type="text"
                                value={formData.cardNumber}
                                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                                className="checkout-input-v2-terracotta !pl-16"
                                required
                              />
                            </div>
                          </div>

                          {/* Expiry and CVC */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                                {locale === 'ka' ? 'ვადა' : 'Expiry Date'}
                              </label>
                              <input
                                type="text"
                                value={formData.cardExpiry}
                                onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                                placeholder="MM / YY"
                                maxLength={5}
                                className="checkout-input-v2-terracotta"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                                CVC
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={formData.cardCvc}
                                  onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                                  placeholder="•••"
                                  maxLength={4}
                                  className="checkout-input-v2-terracotta !pr-12"
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
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                              {locale === 'ka' ? 'სახელი ბარათზე' : 'Cardholder Name'}
                            </label>
                            <input
                              type="text"
                              value={formData.cardName}
                              onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                              placeholder={locale === 'ka' ? 'სახელი გვარი' : 'John Doe'}
                              className="checkout-input-v2-terracotta"
                              required
                            />
                          </div>

                          {/* Save card checkbox */}
                          {isAuthenticated && (
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors -mx-3">
                              <input
                                type="checkbox"
                                checked={saveNewCard}
                                onChange={(e) => setSaveNewCard(e.target.checked)}
                                className="w-5 h-5 rounded border-neutral-300 text-[#E07B4F] focus:ring-[#E07B4F]"
                              />
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#E07B4F]" />
                                <span className="text-sm text-[var(--color-text-primary)]">
                                  {locale === 'ka' ? 'ბარათის შენახვა მომავალი გადახდებისთვის' : 'Save card for future purchases'}
                                </span>
                              </div>
                            </label>
                          )}
                        </>
                      )}

                      {/* Submit Button - terracotta */}
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="checkout-submit-btn-terracotta group"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{locale === 'ka' ? 'მუშავდება...' : 'Processing...'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <Lock className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>
                              {locale === 'ka' ? `გადაიხადე ${tier.currency}${price}` : `Pay ${tier.currency}${price}`}
                            </span>
                            <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </button>

                      <p className="text-xs text-center text-[var(--color-text-tertiary)] leading-relaxed">
                        {locale === 'ka'
                          ? 'გადახდით თქვენ ეთანხმებით ჩვენს მომსახურების პირობებს და კონფიდენციალურობის პოლიტიკას'
                          : 'By completing payment, you agree to our Terms of Service and Privacy Policy'}
                      </p>
                    </form>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl checkout-bank-details">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[var(--color-text-secondary)]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[var(--color-text-primary)]">
                              {locale === 'ka' ? 'საბანკო გადარიცხვა' : 'Bank Transfer Details'}
                            </h3>
                            <p className="text-xs text-[var(--color-text-tertiary)]">
                              {locale === 'ka' ? 'გადარიცხე ქვემოთ მოცემულ ანგარიშზე' : 'Transfer to the account below'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {[
                            { label: locale === 'ka' ? 'ბანკი' : 'Bank', value: 'TBC Bank' },
                            { label: 'IBAN', value: 'GE00TB0000000000000000', mono: true },
                            { label: locale === 'ka' ? 'მიმღები' : 'Recipient', value: 'Homico LLC' },
                            { label: locale === 'ka' ? 'თანხა' : 'Amount', value: `${tier.currency}${price}`, highlight: true },
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--color-border)]/50 last:border-0">
                              <span className="text-sm text-[var(--color-text-tertiary)]">{item.label}</span>
                              <span className={`text-sm ${item.highlight ? 'font-bold text-[#E07B4F]' : 'font-medium text-[var(--color-text-primary)]'} ${item.mono ? 'font-mono text-xs' : ''}`}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                        <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          {locale === 'ka'
                            ? 'გადარიცხვის შემდეგ გთხოვთ გამოაგზავნოთ ქვითარი info@homico.ge მისამართზე. თქვენი გეგმა გააქტიურდება 24 საათის განმავლობაში.'
                            : 'After completing the transfer, please send the receipt to info@homico.ge. Your plan will be activated within 24 hours.'}
                        </p>
                      </div>
                    </div>
                  )}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E07B4F] flex items-center justify-center animate-pulse">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#E07B4F] border-t-transparent" />
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
