'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { X, Shield, Star, Phone, MessageCircle, CheckCircle } from 'lucide-react';

const ACCENT_COLOR = '#C4735B';

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
  proPhone,
  isLoading = false,
}: HiringChoiceModalProps) {
  const { locale } = useLanguage();

  if (!isOpen) return null;

  const benefits = [
    {
      icon: Shield,
      title: locale === 'ka' ? 'გარანტია' : 'Quality Guarantee',
      description: locale === 'ka'
        ? 'სამუშაოს ხარისხზე გარანტია თუ რამე არასწორად წარიმართება'
        : 'Work quality guarantee if something goes wrong',
    },
    {
      icon: Star,
      title: locale === 'ka' ? 'მიმოხილვები' : 'Reviews',
      description: locale === 'ka'
        ? 'დაწერე მიმოხილვა და დაეხმარე სხვებს სწორი არჩევანის გაკეთებაში'
        : 'Write reviews and help others make the right choice',
    },
    {
      icon: MessageCircle,
      title: locale === 'ka' ? 'ჩატი' : 'In-App Chat',
      description: locale === 'ka'
        ? 'უსაფრთხო კომუნიკაცია პლატფორმის შიგნით'
        : 'Secure communication within the platform',
    },
    {
      icon: CheckCircle,
      title: locale === 'ka' ? 'უსაფრთხო გადახდა' : 'Secure Payment',
      description: locale === 'ka'
        ? 'თანხა დაცულია სამუშაოს დასრულებამდე'
        : 'Payment is protected until work is completed',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B8654D 100%)`
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {locale === 'ka' ? 'როგორ გსურთ გაგრძელება?' : 'How would you like to proceed?'}
              </h2>
              <p className="text-white/80 text-sm">
                {locale === 'ka' ? `${proName}-თან დაკავშირება` : `Connect with ${proName}`}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits section */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
            {locale === 'ka' ? 'Homico-ს უპირატესობები' : 'Benefits of Hiring through Homico'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${ACCENT_COLOR}15` }}
                >
                  <benefit.icon className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {benefit.title}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-5 space-y-3">
          {/* Hire through Homico */}
          <button
            onClick={onChooseHomico}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 rounded-xl transition-all disabled:opacity-50"
            style={{
              backgroundColor: ACCENT_COLOR,
              boxShadow: `0 4px 14px ${ACCENT_COLOR}40`
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">
                  {locale === 'ka' ? 'დაქირავება Homico-ზე' : 'Hire through Homico'}
                </p>
                <p className="text-xs text-white/80">
                  {locale === 'ka' ? 'რეკომენდირებული • გარანტიით' : 'Recommended • With guarantee'}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Contact Directly */}
          <button
            onClick={onChooseDirect}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Phone className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {locale === 'ka' ? 'პირდაპირ დაკავშირება' : 'Contact Directly'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {locale === 'ka' ? 'გარანტიის გარეშე' : 'Without platform guarantee'}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Footer note */}
        <div className="px-6 pb-5">
          <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
            {locale === 'ka'
              ? 'ორივე შემთხვევაში, სპეციალისტი შეტყობინებას მიიღებს'
              : 'In both cases, the professional will be notified'}
          </p>
        </div>
      </div>
    </div>
  );
}
