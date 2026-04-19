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
  const { t } = useLanguage();
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
      title: t('proposal.workGuarantee'),
      description: t('proposal.freeFixesIfAnythingGoes'),
      highlight: true,
    },
    {
      icon: Zap,
      title: t('proposal.secureEscrow'),
      description: t('proposal.paymentHeldUntilWorkIs'),
      highlight: true,
    },
    {
      icon: MessageSquare,
      title: t('proposal.inappMessaging'),
      description: t('proposal.allCommunicationSavedProtected'),
      highlight: false,
    },
    {
      icon: Star,
      title: t('proposal.leaveReviews'),
      description: t('proposal.helpOthersMakeInformedDecisions'),
      highlight: false,
    },
  ];

  const directRisks = [
    t('proposal.noWorkGuarantee'),
    t('proposal.unprotectedPayment'),
    t('proposal.noDisputeResolution'),
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
          background: 'var(--hm-bg-elevated)',
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
          <div className="absolute -left-4 top-16 h-24 w-24 rounded-full bg-[var(--hm-brand-500)]/10 blur-xl" />

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
                <Crown className="h-6 w-6 text-[var(--hm-brand-400)]" />
              </div>
              <div>
                <h2
                  className="text-xl font-semibold tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {t('proposal.chooseHowToProceed')}
                </h2>
                <p className="text-sm text-white/60">
                  {t('proposal.hiringName', { name: proName })}
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
                borderColor: hoveredOption === 'homico' ? 'var(--hm-brand-500)' : 'var(--hm-brand-500)',
                background: hoveredOption === 'homico'
                  ? 'linear-gradient(135deg, rgba(224, 123, 79, 0.08) 0%, rgba(224, 123, 79, 0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(224, 123, 79, 0.05) 0%, rgba(224, 123, 79, 0.02) 100%)',
                transform: hoveredOption === 'homico' ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hoveredOption === 'homico'
                  ? '0 8px 32px rgba(224, 123, 79, 0.2), 0 2px 8px rgba(224, 123, 79, 0.1)'
                  : '0 2px 12px rgba(224, 123, 79, 0.08)',
              }}
            >
              {/* Free badge */}
              <div
                className="absolute -right-8 top-4 rotate-45 px-10 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
              >
                {t('proposal.freeBadge')}
              </div>

              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, var(--hm-brand-500) 0%, #D13C14 100%)',
                    boxShadow: '0 4px 12px rgba(224, 123, 79, 0.3)',
                  }}
                >
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {t('proposal.hireThroughHomico')}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--hm-brand-500)]" />
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--hm-brand-500)' }}
                    >
                      {t('proposal.fullProtection')}
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
                          ? 'linear-gradient(135deg, var(--hm-brand-500) 0%, #D13C14 100%)'
                          : 'rgba(239,78,36,0.1)',
                      }}
                    >
                      {feature.highlight ? (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      ) : (
                        <feature.icon className="h-3 w-3 text-[var(--hm-brand-600)]" />
                      )}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium leading-tight"
                        style={{ color: 'var(--hm-fg-primary)' }}
                      >
                        {feature.title}
                      </p>
                      <p
                        className="text-xs leading-tight"
                        style={{ color: 'var(--hm-fg-muted)' }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Temporary free notice */}
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[var(--hm-success-50)]/20 px-3 py-2 border border-emerald-200/50">
                <Sparkles className="h-4 w-4 text-[var(--hm-success-500)] flex-shrink-0" />
                <p className="text-xs text-[var(--hm-success-500)]">
                  {t('proposal.tempFreeNotice')}
                </p>
              </div>

              {/* CTA area */}
              <div
                className="mt-auto flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-300"
                style={{
                  background: hoveredOption === 'homico'
                    ? 'var(--hm-brand-500)'
                    : 'rgba(239,78,36,0.1)',
                }}
              >
                <span
                  className="text-sm font-semibold transition-colors duration-300"
                  style={{
                    color: hoveredOption === 'homico' ? 'white' : 'var(--hm-brand-500)',
                  }}
                >
                  {t('proposal.hireWithGuarantee')}
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
                  ? 'var(--hm-border-strong)'
                  : 'var(--hm-border-subtle)',
                background: hoveredOption === 'direct'
                  ? 'var(--hm-bg-page)'
                  : 'transparent',
                transform: hoveredOption === 'direct' ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: 'var(--hm-n-200)',
                  }}
                >
                  <Phone className="h-5 w-5" style={{ color: 'var(--hm-fg-muted)' }} />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {t('proposal.contactDirectly')}
                  </h3>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--hm-fg-muted)' }}
                  >
                    {t('proposal.offplatform')}
                  </span>
                </div>
              </div>

              {/* Risks/limitations */}
              <div className="mb-4 space-y-2">
                <p
                  className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--hm-fg-muted)' }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t('proposal.beAware')}
                </p>
                {directRisks.map((risk, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--hm-fg-muted)' }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: 'var(--hm-fg-muted)' }}
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
                  borderColor: 'var(--hm-border-subtle)',
                  background: hoveredOption === 'direct' ? 'var(--hm-n-200)' : 'transparent',
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--hm-fg-secondary)' }}
                >
                  {t('proposal.continueAnyway')}
                </span>
              </div>
            </button>
          </div>

          {/* Bottom trust indicator */}
          <div
            className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3"
            style={{ background: 'var(--hm-bg-tertiary)' }}
          >
            <ShieldCheck className="h-4 w-4 text-[var(--hm-fg-secondary)]" />
            <p
              className="text-xs"
              style={{ color: 'var(--hm-fg-muted)' }}
            >
              {t('proposal.1000SuccessfulProjectsCompletedThrough')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
