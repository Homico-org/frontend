'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Headphones,
  Hotel,
  Landmark,
  MessageSquareQuote,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormGroup, Input, Textarea } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { SelectionGroup } from '@/components/ui/SelectionGroup';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ACCENT_COLOR, GRADIENTS, SHADOWS } from '@/constants/theme';
import Header, { HeaderSpacer } from '@/components/common/Header';

// ─── Animation variants ───
const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease, delay: i * 0.1 },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease, delay: i * 0.1 },
  }),
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease },
  },
};

const lineGrow = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, ease, delay: 0.3 },
  },
};

export default function ForBusinessPage() {
  const { t, locale } = useLanguage();
  const toast = useToast();

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    serviceType: '',
    description: '',
    preferredPlan: 'not_sure',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const serviceTypeOptions = [
    { value: 'cleaning', label: t('business.serviceTypeCleaning') },
    { value: 'repair', label: t('business.serviceTypeRepair') },
    { value: 'design', label: t('business.serviceTypeDesign') },
    { value: 'construction', label: t('business.serviceTypeConstruction') },
    { value: 'other', label: t('business.serviceTypeOther') },
  ];

  const planOptions = [
    { value: 'on_demand', label: t('business.planOnDemand') },
    { value: 'standard', label: t('business.planStandard') },
    { value: 'business', label: t('business.planBusiness') },
    { value: 'not_sure', label: t('business.planNotSure') },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = t('validation.required');
    if (!formData.contactName.trim()) newErrors.contactName = t('validation.required');
    if (!formData.email.trim()) newErrors.email = t('validation.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('validation.invalidEmail');
    if (!formData.phone.trim()) newErrors.phone = t('validation.required');
    if (!formData.serviceType) newErrors.serviceType = t('validation.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post('/business/quote-request', formData);
      setIsSubmitted(true);
      toast.success(t('business.formSuccess'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToQuote = () => {
    document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const tiers = [
    {
      titleKey: 'tierOnDemandTitle',
      descKey: 'tierOnDemandDesc',
      features: ['tierOnDemandFeature1', 'tierOnDemandFeature2', 'tierOnDemandFeature3'],
    },
    {
      titleKey: 'tierStandardTitle',
      descKey: 'tierStandardDesc',
      features: ['tierStandardFeature1', 'tierStandardFeature2', 'tierStandardFeature3'],
      featured: true,
    },
    {
      titleKey: 'tierBusinessTitle',
      descKey: 'tierBusinessDesc',
      features: ['tierBusinessFeature1', 'tierBusinessFeature2', 'tierBusinessFeature3'],
    },
  ];

  const benefits = [
    { icon: Shield, titleKey: 'benefitQualityTitle', descKey: 'benefitQualityDesc' },
    { icon: Zap, titleKey: 'benefitSpeedTitle', descKey: 'benefitSpeedDesc' },
    { icon: Clock, titleKey: 'benefitFlexibilityTitle', descKey: 'benefitFlexibilityDesc' },
    { icon: Headphones, titleKey: 'benefitSupportTitle', descKey: 'benefitSupportDesc' },
  ];

  const steps = [
    { icon: Building2, num: '01', titleKey: 'howItWorksStep1Title', descKey: 'howItWorksStep1Desc' },
    { icon: Users, num: '02', titleKey: 'howItWorksStep2Title', descKey: 'howItWorksStep2Desc' },
    { icon: CheckCircle, num: '03', titleKey: 'howItWorksStep3Title', descKey: 'howItWorksStep3Desc' },
  ];

  const trustedByTypes = [
    { icon: Hotel, labelKey: 'trustedByHotels' },
    { icon: Building, labelKey: 'trustedByProperty' },
    { icon: ShoppingBag, labelKey: 'trustedByRetail' },
    { icon: Landmark, labelKey: 'trustedByCorporate' },
    { icon: Building2, labelKey: 'trustedByDevelopers' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />
      <HeaderSpacer />

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: GRADIENTS.accent.primary }} />
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.08] bg-white blur-3xl"
            initial={{ x: '30%', y: '-60%' }}
            animate={{ x: '25%', y: '-50%' }}
            transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.06] bg-white blur-3xl"
            initial={{ x: '-30%', y: '40%' }}
            animate={{ x: '-25%', y: '33%' }}
            transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 lg:pt-32 pb-20 sm:pb-28 lg:pb-36">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">{t('business.heroTag')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-3xl sm:text-4xl lg:text-[56px] font-extrabold text-white leading-[1.08] tracking-tight mb-6"
            >
              {t('business.heroTitle')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="text-base sm:text-lg lg:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {t('business.heroSubtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={scrollToQuote}
                className="h-13 px-8 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'white', color: ACCENT_COLOR }}
              >
                {t('business.heroCta')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>

          {/* Trust stats */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-14 sm:mt-16 max-w-3xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { value: '500+', label: t('business.statProfessionals') },
              { value: '98%', label: t('business.statSatisfaction') },
              { value: '24h', label: t('business.statMatchTime') },
              { value: '4.9', label: t('business.statRating'), icon: Star },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i + 5}
                className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-center"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-xl sm:text-2xl font-bold text-white">{stat.value}</span>
                  {stat.icon && <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 fill-yellow-300" />}
                </div>
                <p className="text-xs sm:text-sm text-white/60 leading-tight">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Trusted By ─── */}
      <motion.section
        className="py-10 sm:py-14 px-4 sm:px-6 border-b border-[var(--color-border-subtle)]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={staggerContainer}
      >
        <div className="max-w-5xl mx-auto">
          <motion.p
            variants={fadeIn}
            className="text-center text-sm font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-8"
          >
            {t('business.trustedByTitle')}
          </motion.p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {trustedByTypes.map(({ icon: Icon, labelKey }, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-default)]"
              >
                <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />
                <span className="text-sm font-medium whitespace-nowrap">{t(`business.${labelKey}`)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── How It Works ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14 sm:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: ACCENT_COLOR }}
            >
              {t('business.howItWorksTitle')}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]"
            >
              {t('business.howItWorksTitle')}
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">
            {/* Connecting line — animated */}
            <motion.div
              className="hidden md:block absolute top-16 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px origin-left"
              style={{ background: `linear-gradient(90deg, transparent, ${ACCENT_COLOR}30, ${ACCENT_COLOR}30, transparent)` }}
              variants={lineGrow}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            />

            {steps.map(({ icon: StepIcon, num, titleKey, descKey }, i) => (
              <motion.div
                key={i}
                className="relative text-center group"
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
              >
                <div className="relative z-10 flex justify-center mb-6">
                  <motion.div
                    className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT_COLOR}10, ${ACCENT_COLOR}05)`,
                      border: `1.5px solid ${ACCENT_COLOR}18`,
                    }}
                    whileHover={{ scale: 1.08, boxShadow: `0 8px 30px ${ACCENT_COLOR}15` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <span
                      className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1"
                      style={{ color: `${ACCENT_COLOR}70` }}
                    >
                      {num}
                    </span>
                    <StepIcon className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                  {t(`business.${titleKey}`)}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[260px] mx-auto">
                  {t(`business.${descKey}`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14 sm:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.h2
              variants={fadeUp}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]"
            >
              {t('business.benefitsTitle')}
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {benefits.map(({ icon: BenefitIcon, titleKey, descKey }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative p-6 sm:p-8 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] transition-shadow duration-300 hover:shadow-lg"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at top left, ${ACCENT_COLOR}06, transparent 70%)` }}
                />
                <div className="relative">
                  <motion.div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${ACCENT_COLOR}10` }}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <BenefitIcon className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                  </motion.div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-2">
                    {t(`business.${titleKey}`)}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {t(`business.${descKey}`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Service Tiers ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14 sm:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.h2
              variants={fadeUp}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-3"
            >
              {t('business.tiersTitle')}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-[var(--color-text-secondary)] max-w-lg mx-auto"
            >
              {t('business.tiersSubtitle')}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
            {tiers.map(({ titleKey, descKey, features, featured }, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={cn(
                  'relative rounded-2xl border overflow-hidden',
                  featured
                    ? 'border-transparent shadow-xl md:-mt-4 md:mb-[-16px]'
                    : 'border-[var(--color-border-subtle)] hover:shadow-md',
                )}
                style={featured ? {
                  border: `2px solid ${ACCENT_COLOR}`,
                  boxShadow: `0 20px 60px ${ACCENT_COLOR}15`,
                } : undefined}
              >
                {featured && (
                  <motion.div
                    className="h-1"
                    style={{ background: GRADIENTS.accent.primary }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                  />
                )}

                <div className="p-6 sm:p-8 bg-[var(--color-bg-elevated)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {t(`business.${titleKey}`)}
                    </h3>
                    {featured && (
                      <Badge variant="accent-solid" className="text-xs">
                        {t('business.mostPopular')}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed min-h-[44px]">
                    {t(`business.${descKey}`)}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {features.map((featureKey, fi) => (
                      <motion.li
                        key={featureKey}
                        className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + fi * 0.08 }}
                      >
                        <CheckCircle
                          className="w-[18px] h-[18px] flex-shrink-0 mt-0.5"
                          style={{ color: ACCENT_COLOR }}
                        />
                        <span>{t(`business.${featureKey}`)}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <Button
                    variant={featured ? 'default' : 'outline'}
                    className={cn('w-full rounded-xl h-11', featured && 'shadow-md')}
                    onClick={scrollToQuote}
                    style={featured ? {
                      backgroundColor: ACCENT_COLOR,
                      color: 'white',
                      boxShadow: `0 4px 16px ${ACCENT_COLOR}30`,
                    } : undefined}
                  >
                    {featured ? t('business.getStarted') : t('business.heroCta')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[var(--color-bg-secondary)]">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={scaleIn}>
            <MessageSquareQuote
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-6 sm:mb-8 opacity-20"
              style={{ color: ACCENT_COLOR }}
            />
          </motion.div>
          <motion.blockquote
            variants={fadeUp}
            custom={1}
            className="text-lg sm:text-xl lg:text-2xl font-medium text-[var(--color-text-primary)] leading-relaxed mb-8"
          >
            &ldquo;{t('business.testimonialQuote')}&rdquo;
          </motion.blockquote>
          <motion.div variants={fadeUp} custom={2}>
            <p className="font-semibold text-[var(--color-text-primary)]">
              {t('business.testimonialAuthor')}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {t('business.testimonialRole')}
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Quote Request Form ─── */}
      <section id="quote-form" className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, var(--color-bg-secondary) 0%, transparent 15%, transparent 85%, var(--color-bg-primary) 100%)`,
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12 sm:mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: ACCENT_COLOR }}
            >
              {t('business.heroCta')}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] mb-3"
            >
              {t('business.quoteTitle')}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[var(--color-text-secondary)] max-w-md mx-auto"
            >
              {t('business.quoteSubtitle')}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
            {/* Sidebar — trust points */}
            <motion.div
              className="lg:col-span-2 order-2 lg:order-1"
              variants={slideInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <div className="lg:sticky lg:top-24 space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-5">
                  {t('business.formWhyTitle')}
                </h3>

                {[
                  { icon: Clock, labelKey: 'formWhy24h' },
                  { icon: Shield, labelKey: 'formWhyNoContract' },
                  { icon: Users, labelKey: 'formWhyManager' },
                  { icon: CheckCircle, labelKey: 'formWhyGuarantee' },
                ].map(({ icon: TrustIcon, labelKey }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${ACCENT_COLOR}10` }}
                    >
                      <TrustIcon className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {t(`business.${labelKey}`)}
                    </span>
                  </motion.div>
                ))}

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { value: '500+', labelKey: 'statProfessionals' },
                    { value: '98%', labelKey: 'statSatisfaction' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="p-4 rounded-xl text-center"
                      style={{ background: `${ACCENT_COLOR}08`, border: `1px solid ${ACCENT_COLOR}12` }}
                    >
                      <p className="text-2xl font-bold" style={{ color: ACCENT_COLOR }}>{stat.value}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {t(`business.${stat.labelKey}`)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              className="lg:col-span-3 order-1 lg:order-2"
              variants={slideInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <Card variant="elevated" size="xl" className="shadow-lg">
                <CardBody className="p-6 sm:p-8">
                  {isSubmitted ? (
                    <motion.div
                      className="text-center py-10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <motion.div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: '#22C55E15' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                      >
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                        {t('business.formSuccess')}
                      </h3>
                      <p className="text-[var(--color-text-secondary)] mb-8 max-w-sm mx-auto">
                        {t('business.formSuccessMessage')}
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({ companyName: '', contactName: '', email: '', phone: '', serviceType: '', description: '', preferredPlan: 'not_sure' });
                        }}
                      >
                        {t('business.submitAnother')}
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormGroup
                          label={t('business.formCompanyName')}
                          required
                          error={errors.companyName}
                        >
                          <Input
                            value={formData.companyName}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            error={!!errors.companyName}
                          />
                        </FormGroup>
                        <FormGroup
                          label={t('business.formContactName')}
                          required
                          error={errors.contactName}
                        >
                          <Input
                            value={formData.contactName}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                            error={!!errors.contactName}
                          />
                        </FormGroup>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormGroup
                          label={t('business.formEmail')}
                          required
                          error={errors.email}
                        >
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            error={!!errors.email}
                          />
                        </FormGroup>
                        <FormGroup
                          label={t('business.formPhone')}
                          required
                          error={errors.phone}
                        >
                          <PhoneInput
                            value={formData.phone}
                            onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                            variant={errors.phone ? 'error' : 'default'}
                          />
                        </FormGroup>
                      </div>

                      <FormGroup
                        label={t('business.formServiceType')}
                        required
                        error={errors.serviceType}
                      >
                        <SelectionGroup
                          options={serviceTypeOptions}
                          value={formData.serviceType}
                          onChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                          layout="grid"
                          columns={3}
                          locale={locale}
                          size="sm"
                        />
                      </FormGroup>

                      <FormGroup
                        label={t('business.formDescription')}
                        optional
                      >
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder={t('business.formDescriptionPlaceholder')}
                          rows={3}
                        />
                      </FormGroup>

                      <FormGroup label={t('business.formPreferredPlan')}>
                        <SelectionGroup
                          options={planOptions}
                          value={formData.preferredPlan}
                          onChange={(value) => setFormData(prev => ({ ...prev, preferredPlan: value }))}
                          layout="grid"
                          columns={4}
                          locale={locale}
                          size="sm"
                        />
                      </FormGroup>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full h-12 text-base font-semibold rounded-xl transition-all hover:shadow-lg"
                        style={{
                          backgroundColor: ACCENT_COLOR,
                          color: 'white',
                          boxShadow: SHADOWS.button.primary,
                        }}
                      >
                        {isSubmitting ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            {t('business.formSubmit')}
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA Banner ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: GRADIENTS.accent.primary }} />
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 left-1/2 w-[500px] h-[500px] rounded-full opacity-[0.08] bg-white blur-3xl -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <motion.div
          className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4"
          >
            {t('business.ctaTitle')}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-base sm:text-lg text-white/70 mb-8 max-w-xl mx-auto"
          >
            {t('business.ctaSubtitle')}
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Button
              size="lg"
              onClick={scrollToQuote}
              className="h-13 px-8 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'white', color: ACCENT_COLOR }}
            >
              {t('business.heroCta')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-4 sm:px-6 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/favicon.png" alt="Homico" width={28} height={28} className="rounded-lg" />
            <span className="text-base font-bold text-[var(--color-text-primary)] group-hover:opacity-80 transition-opacity">
              Homico
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
            <Link href="/about" className="hover:text-[var(--color-text-primary)] transition-colors">
              {t('common.about')}
            </Link>
            <Link href="/help" className="hover:text-[var(--color-text-primary)] transition-colors">
              {t('common.help')}
            </Link>
            <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">
              {t('settings.privacy')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
