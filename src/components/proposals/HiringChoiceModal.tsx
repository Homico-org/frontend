'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  MessageSquare,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface HiringChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseHomico: () => void;
  onChooseDirect: () => void;
  proName: string;
  proPhone?: string;
  isLoading?: boolean;
}

export default function HiringChoiceModal({
  isOpen,
  onClose,
  onChooseHomico,
  onChooseDirect,
  proName,
  isLoading = false,
}: HiringChoiceModalProps) {
  const { locale } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<'homico' | 'direct' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const homicoFeatures = [
    {
      icon: ShieldCheck,
      title: locale === 'ka' ? 'სამუშაოს გარანტია' : 'Work Guarantee',
      description: locale === 'ka'
        ? 'პრობლემის შემთხვევაში უფასოდ გამოვასწორებთ'
        : 'Free fixes if anything goes wrong',
      highlight: true,
    },
    {
      icon: Zap,
      title: locale === 'ka' ? 'უსაფრთხო გადახდა' : 'Secure Escrow',
      description: locale === 'ka'
        ? 'თანხა დაცულია სამუშაოს დასრულებამდე'
        : 'Payment held until work is complete',
      highlight: true,
    },
    {
      icon: MessageSquare,
      title: locale === 'ka' ? 'პლატფორმაზე ჩატი' : 'In-App Messaging',
      description: locale === 'ka'
        ? 'ყველა კომუნიკაცია შენახული და დაცული'
        : 'All communication saved & protected',
      highlight: false,
    },
    {
      icon: Star,
      title: locale === 'ka' ? 'მიმოხილვის დატოვება' : 'Leave Reviews',
      description: locale === 'ka'
        ? 'დაეხმარე სხვებს სწორი არჩევანის გაკეთებაში'
        : 'Help others make informed decisions',
      highlight: false,
    },
  ];

  const directRisks = [
    locale === 'ka' ? 'გარანტიის გარეშე' : 'No work guarantee',
    locale === 'ka' ? 'დაუცველი გადახდა' : 'Unprotected payment',
    locale === 'ka' ? 'დავის შემთხვევაში დახმარების გარეშე' : 'No dispute resolution',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
        style={{ opacity: isAnimating ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 ease-out"
        style={{
          background: 'var(--color-bg-elevated)',
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          opacity: isAnimating ? 1 : 0,
        }}
      >
        {/* Decorative gradient header */}
        <div
          className="relative h-32 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a4d3e 0%, #0d3a2e 50%, #082820 100%)',
          }}
        >
          {/* Animated grain texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Floating decorative elements */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -left-4 top-16 h-24 w-24 rounded-full bg-terracotta-500/10 blur-xl" />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 z-10 rounded-xl bg-white/10 text-white/80 backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Header content */}
          <div className="relative flex h-full flex-col justify-end p-6 pb-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Crown className="h-6 w-6 text-terracotta-400" />
              </div>
              <div>
                <h2
                  className="text-xl font-semibold tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {locale === 'ka' ? 'აირჩიე როგორ გაგრძელდეს' : 'Choose How to Proceed'}
                </h2>
                <p className="text-sm text-white/60">
                  {locale === 'ka'
                    ? `დაქირავება: ${proName}`
                    : `Hiring: ${proName}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6">
          {/* Two-column comparison on larger screens */}
          <div className="grid gap-4 md:grid-cols-2">

            {/* HOMICO OPTION - Premium styling */}
            <button
              onClick={onChooseHomico}
              disabled={isLoading}
              onMouseEnter={() => setHoveredOption('homico')}
              onMouseLeave={() => setHoveredOption(null)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-300 disabled:opacity-50"
              style={{
                borderColor: hoveredOption === 'homico' ? 'var(--color-accent)' : 'var(--color-accent)',
                background: hoveredOption === 'homico'
                  ? 'linear-gradient(135deg, rgba(224, 123, 79, 0.08) 0%, rgba(224, 123, 79, 0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(224, 123, 79, 0.05) 0%, rgba(224, 123, 79, 0.02) 100%)',
                transform: hoveredOption === 'homico' ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hoveredOption === 'homico'
                  ? '0 8px 32px rgba(224, 123, 79, 0.2), 0 2px 8px rgba(224, 123, 79, 0.1)'
                  : '0 2px 12px rgba(224, 123, 79, 0.08)',
              }}
            >
              {/* Recommended badge */}
              <div
                className="absolute -right-8 top-4 rotate-45 px-10 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                {locale === 'ka' ? 'რეკომენდებული' : 'Recommended'}
              </div>

              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent) 0%, #D26B3F 100%)',
                    boxShadow: '0 4px 12px rgba(224, 123, 79, 0.3)',
                  }}
                >
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {locale === 'ka' ? 'Homico-ზე დაქირავება' : 'Hire through Homico'}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {locale === 'ka' ? 'სრული დაცვა' : 'Full Protection'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="mb-4 space-y-2.5">
                {homicoFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 transition-all duration-200"
                    style={{
                      transitionDelay: `${index * 50}ms`,
                      transform: hoveredOption === 'homico' ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: feature.highlight
                          ? 'linear-gradient(135deg, var(--color-accent) 0%, #D26B3F 100%)'
                          : 'var(--color-accent-soft)',
                      }}
                    >
                      {feature.highlight ? (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      ) : (
                        <feature.icon className="h-3 w-3 text-terracotta-600" />
                      )}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium leading-tight"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {feature.title}
                      </p>
                      <p
                        className="text-xs leading-tight"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA area */}
              <div
                className="mt-auto flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300"
                style={{
                  background: hoveredOption === 'homico'
                    ? 'var(--color-accent)'
                    : 'var(--color-accent-soft)',
                }}
              >
                <span
                  className="text-sm font-semibold transition-colors duration-300"
                  style={{
                    color: hoveredOption === 'homico' ? 'white' : 'var(--color-accent)',
                  }}
                >
                  {locale === 'ka' ? 'დაქირავება გარანტიით →' : 'Hire with guarantee →'}
                </span>
              </div>
            </button>

            {/* DIRECT OPTION - Muted, secondary styling */}
            <button
              onClick={onChooseDirect}
              disabled={isLoading}
              onMouseEnter={() => setHoveredOption('direct')}
              onMouseLeave={() => setHoveredOption(null)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 disabled:opacity-50"
              style={{
                borderColor: hoveredOption === 'direct'
                  ? 'var(--color-border-strong)'
                  : 'var(--color-border-subtle)',
                background: hoveredOption === 'direct'
                  ? 'var(--color-bg-secondary)'
                  : 'transparent',
                transform: hoveredOption === 'direct' ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: 'var(--color-bg-muted)',
                  }}
                >
                  <Phone className="h-5 w-5" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {locale === 'ka' ? 'პირდაპირ დაკავშირება' : 'Contact Directly'}
                  </h3>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {locale === 'ka' ? 'პლატფორმის გარეშე' : 'Off-platform'}
                  </span>
                </div>
              </div>

              {/* Risks/limitations */}
              <div className="mb-4 space-y-2">
                <p
                  className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {locale === 'ka' ? 'გაითვალისწინე' : 'Be aware'}
                </p>
                {directRisks.map((risk, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--color-text-muted)' }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {risk}
                    </span>
                  </div>
                ))}
              </div>

              {/* Spacer to push CTA to bottom */}
              <div className="flex-1" />

              {/* CTA area */}
              <div
                className="flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300"
                style={{
                  borderColor: 'var(--color-border-subtle)',
                  background: hoveredOption === 'direct' ? 'var(--color-bg-muted)' : 'transparent',
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {locale === 'ka' ? 'მაინც პირდაპირ →' : 'Continue anyway →'}
                </span>
              </div>
            </button>
          </div>

          {/* Bottom trust indicator */}
          <div
            className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3"
            style={{ background: 'var(--color-bg-tertiary)' }}
          >
            <ShieldCheck className="h-4 w-4 text-forest-600 dark:text-forest-400" />
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {locale === 'ka'
                ? '1000+ წარმატებული პროექტი Homico-ზე დასრულებული'
                : '1000+ successful projects completed through Homico'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
